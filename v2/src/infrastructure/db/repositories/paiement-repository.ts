import { and, asc, eq, gte, lte } from "drizzle-orm";
import type {
  CreerPaiementData,
  PaiementRepository,
  ResultatPaiement,
} from "@/application/ports/paiement-repository";
import type { Paiement } from "@/domain/paiement";
import { withTenant } from "../client";
import { paiements } from "../schema";

function versDomaine(row: typeof paiements.$inferSelect): Paiement {
  return {
    id: row.id,
    tenantId: row.tenantId,
    factureId: row.factureId,
    ref: row.ref,
    montantCentimes: row.montantCentimes,
    mode: row.mode as Paiement["mode"],
    datePaiement: row.datePaiement,
    reference: row.reference,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzlePaiementRepository implements PaiementRepository {
  async creer(data: CreerPaiementData): Promise<ResultatPaiement> {
    return withTenant(data.tenantId, async (tx) => {
      const [cree] = await tx
        .insert(paiements)
        .values({
          tenantId: data.tenantId,
          factureId: data.factureId,
          ref: data.ref,
          montantCentimes: data.montantCentimes,
          mode: data.mode,
          datePaiement: data.datePaiement,
          reference: data.reference ?? null,
          notes: data.notes ?? null,
        })
        .onConflictDoNothing({
          target: [paiements.tenantId, paiements.ref],
        })
        .returning();

      if (cree) return { paiement: versDomaine(cree), cree: true };

      const [existant] = await tx
        .select()
        .from(paiements)
        .where(
          and(
            eq(paiements.tenantId, data.tenantId),
            eq(paiements.ref, data.ref),
          ),
        )
        .limit(1);
      if (!existant) throw new Error("Paiement idempotent introuvable.");
      return { paiement: versDomaine(existant), cree: false };
    });
  }

  async trouverParRef(tenantId: string, ref: string): Promise<Paiement | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(paiements)
        .where(and(eq(paiements.tenantId, tenantId), eq(paiements.ref, ref)))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async listerParFacture(
    tenantId: string,
    factureId: string,
  ): Promise<Paiement[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(paiements)
        .where(
          and(
            eq(paiements.tenantId, tenantId),
            eq(paiements.factureId, factureId),
          ),
        )
        .orderBy(asc(paiements.datePaiement), asc(paiements.createdAt));
      return rows.map(versDomaine);
    });
  }

  async listerParMois(
    tenantId: string,
    debut: string,
    fin: string,
  ): Promise<Paiement[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(paiements)
        .where(
          and(
            eq(paiements.tenantId, tenantId),
            gte(paiements.datePaiement, debut),
            lte(paiements.datePaiement, fin),
          ),
        )
        .orderBy(asc(paiements.datePaiement), asc(paiements.createdAt));
      return rows.map(versDomaine);
    });
  }
}
