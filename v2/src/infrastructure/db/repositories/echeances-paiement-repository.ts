import { and, asc, eq } from "drizzle-orm";
import type {
  CreerEcheancePaiementData,
  EcheancePaiement,
  EcheancesPaiementRepository,
} from "@/application/ports/echeances-paiement-repository";
import { withTenant } from "../client";
import { echeancesPaiement } from "../schema";

function versEcheance(
  row: typeof echeancesPaiement.$inferSelect,
): EcheancePaiement {
  return {
    id: row.id,
    tenantId: row.tenantId,
    reservationId: row.reservationId,
    type: row.type as EcheancePaiement["type"],
    montantCentimes: row.montantCentimes,
    exigibleLe: row.exigibleLe,
    statut: row.statut as EcheancePaiement["statut"],
    paiementId: row.paiementId,
  };
}

export class DrizzleEcheancesPaiementRepository
  implements EcheancesPaiementRepository
{
  async creerPlusieurs(
    echeances: CreerEcheancePaiementData[],
  ): Promise<EcheancePaiement[]> {
    if (echeances.length === 0) return [];
    const tenantId = echeances[0]?.tenantId;
    if (!tenantId || echeances.some((entree) => entree.tenantId !== tenantId)) {
      throw new Error("Échéances de tenants différents.");
    }
    const reservationId = echeances[0]?.reservationId;
    if (!reservationId) throw new Error("Réservation manquante.");

    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .insert(echeancesPaiement)
        .values(
          echeances.map((entree) => ({
            tenantId: entree.tenantId,
            reservationId: entree.reservationId,
            type: entree.type,
            montantCentimes: entree.montantCentimes,
            exigibleLe: entree.exigibleLe,
            statut: entree.statut ?? "a_payer",
          })),
        )
        .onConflictDoNothing({
          target: [
            echeancesPaiement.tenantId,
            echeancesPaiement.reservationId,
            echeancesPaiement.type,
          ],
        })
        .returning();

      if (rows.length === echeances.length) return rows.map(versEcheance);
      return this.listerParReservation(tenantId, reservationId);
    });
  }

  async listerParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<EcheancePaiement[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(echeancesPaiement)
        .where(
          and(
            eq(echeancesPaiement.tenantId, tenantId),
            eq(echeancesPaiement.reservationId, reservationId),
          ),
        )
        .orderBy(asc(echeancesPaiement.exigibleLe), asc(echeancesPaiement.type));
      return rows.map(versEcheance);
    });
  }

  async trouverParId(
    tenantId: string,
    echeanceId: string,
  ): Promise<EcheancePaiement | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(echeancesPaiement)
        .where(
          and(
            eq(echeancesPaiement.tenantId, tenantId),
            eq(echeancesPaiement.id, echeanceId),
          ),
        )
        .limit(1);
      return row ? versEcheance(row) : null;
    });
  }

  async marquerPaye(
    tenantId: string,
    echeanceId: string,
    paiementId: string,
  ): Promise<void> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(echeancesPaiement)
        .set({ statut: "paye", paiementId, updatedAt: new Date() })
        .where(
          and(
            eq(echeancesPaiement.tenantId, tenantId),
            eq(echeancesPaiement.id, echeanceId),
          ),
        );
    });
  }

  async annulerRestantes(
    tenantId: string,
    reservationId: string,
  ): Promise<number> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .update(echeancesPaiement)
        .set({ statut: "annule", updatedAt: new Date() })
        .where(
          and(
            eq(echeancesPaiement.tenantId, tenantId),
            eq(echeancesPaiement.reservationId, reservationId),
            eq(echeancesPaiement.statut, "a_payer"),
          ),
        )
        .returning({ id: echeancesPaiement.id });
      return rows.length;
    });
  }
}
