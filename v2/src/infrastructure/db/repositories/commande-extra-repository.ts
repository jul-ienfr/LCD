import { and, asc, eq } from "drizzle-orm";
import type {
  CommandeExtraRepository,
  CreerCommandeExtraData,
  ResultatCommandeExtra,
} from "@/application/ports/extra-repository";
import type { CommandeExtra } from "@/domain/extra";
import { withTenant } from "../client";
import { commandesExtras } from "../schema";

function versDomaine(
  row: typeof commandesExtras.$inferSelect,
): CommandeExtra {
  return {
    id: row.id,
    tenantId: row.tenantId,
    reservationId: row.reservationId,
    extraId: row.extraId,
    quantite: row.quantite,
    prixUnitaireCentimes: row.prixUnitaireCentimes,
    totalCentimes: row.totalCentimes,
    ref: row.ref,
    statut: row.statut as CommandeExtra["statut"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleCommandeExtraRepository
  implements CommandeExtraRepository
{
  async creer(
    data: CreerCommandeExtraData,
  ): Promise<ResultatCommandeExtra> {
    return withTenant(data.tenantId, async (tx) => {
      const [cree] = await tx
        .insert(commandesExtras)
        .values({
          tenantId: data.tenantId,
          reservationId: data.reservationId,
          extraId: data.extraId,
          quantite: data.quantite,
          prixUnitaireCentimes: data.prixUnitaireCentimes,
          totalCentimes: data.totalCentimes,
          ref: data.ref,
        })
        .onConflictDoNothing({
          target: [commandesExtras.tenantId, commandesExtras.ref],
        })
        .returning();

      if (cree) return { commande: versDomaine(cree), cree: true };

      const [existant] = await tx
        .select()
        .from(commandesExtras)
        .where(
          and(
            eq(commandesExtras.tenantId, data.tenantId),
            eq(commandesExtras.ref, data.ref),
          ),
        )
        .limit(1);
      if (!existant) throw new Error("Commande extra idempotente introuvable.");
      return { commande: versDomaine(existant), cree: false };
    });
  }

  async listerParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<CommandeExtra[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(commandesExtras)
        .where(
          and(
            eq(commandesExtras.tenantId, tenantId),
            eq(commandesExtras.reservationId, reservationId),
          ),
        )
        .orderBy(asc(commandesExtras.createdAt));
      return rows.map(versDomaine);
    });
  }

  async listerParTenant(tenantId: string): Promise<CommandeExtra[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(commandesExtras)
        .where(eq(commandesExtras.tenantId, tenantId))
        .orderBy(asc(commandesExtras.createdAt));
      return rows.map(versDomaine);
    });
  }

  async changerStatut(
    tenantId: string,
    id: string,
    statut: CommandeExtra["statut"],
  ): Promise<CommandeExtra | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(commandesExtras)
        .set({ statut, updatedAt: new Date() })
        .where(
          and(
            eq(commandesExtras.tenantId, tenantId),
            eq(commandesExtras.id, id),
          ),
        );
    });
    const rows = await this.listerParTenant(tenantId);
    return rows.find((c) => c.id === id) ?? null;
  }
}
