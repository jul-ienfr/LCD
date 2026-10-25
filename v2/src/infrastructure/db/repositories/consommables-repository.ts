import { and, asc, eq } from "drizzle-orm";
import type { ConsommablesRepository } from "@/application/ports/consommables-repository";
import type {
  Consommable,
  ConsommableInput,
  MouvementStock,
} from "@/domain/stocks";
import { withTenant } from "../client";
import { consommables, mouvementsStock } from "../schema";

function versDomaine(
  row: typeof consommables.$inferSelect,
): Consommable {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    code: row.code,
    label: row.label,
    stock: row.stock,
    unite: row.unite,
    seuil: row.seuil,
    cible: row.cible,
    consoRotation: row.consoRotation,
  };
}

export class DrizzleConsommablesRepository implements ConsommablesRepository {
  async listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<Consommable[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(consommables)
        .where(
          and(
            eq(consommables.tenantId, tenantId),
            eq(consommables.logementId, logementId),
          ),
        )
        .orderBy(asc(consommables.label));
      return rows.map(versDomaine);
    });
  }

  async trouverParCode(
    tenantId: string,
    logementId: string,
    code: string,
  ): Promise<Consommable | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(consommables)
        .where(
          and(
            eq(consommables.tenantId, tenantId),
            eq(consommables.logementId, logementId),
            eq(consommables.code, code),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async enregistrer(input: ConsommableInput): Promise<Consommable> {
    return withTenant(input.tenantId, async (tx) => {
      const [row] = await tx
        .insert(consommables)
        .values({
          ...(input.id ? { id: input.id } : {}),
          tenantId: input.tenantId,
          logementId: input.logementId,
          code: input.code,
          label: input.label,
          stock: input.stock,
          unite: input.unite,
          seuil: input.seuil,
          cible: input.cible,
          consoRotation: input.consoRotation,
        })
        .onConflictDoUpdate({
          target: [
            consommables.tenantId,
            consommables.logementId,
            consommables.code,
          ],
          set: {
            label: input.label,
            stock: input.stock,
            unite: input.unite,
            seuil: input.seuil,
            cible: input.cible,
            consoRotation: input.consoRotation,
            updatedAt: new Date(),
          },
        })
        .returning();
      if (!row) throw new Error("Consommable : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async mettreAJourStock(
    tenantId: string,
    id: string,
    stock: number,
  ): Promise<Consommable> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(consommables)
        .set({ stock, updatedAt: new Date() })
        .where(
          and(eq(consommables.tenantId, tenantId), eq(consommables.id, id)),
        )
        .returning();
      if (!row) throw new Error("Consommable introuvable.");
      return versDomaine(row);
    });
  }

  async mouvementExiste(tenantId: string, ref: string): Promise<boolean> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select({ id: mouvementsStock.id })
        .from(mouvementsStock)
        .where(
          and(
            eq(mouvementsStock.tenantId, tenantId),
            eq(mouvementsStock.ref, ref),
          ),
        )
        .limit(1);
      return Boolean(row);
    });
  }

  async enregistrerMouvement(
    mouvement: Omit<MouvementStock, "id">,
  ): Promise<void> {
    await withTenant(mouvement.tenantId, async (tx) => {
      await tx
        .insert(mouvementsStock)
        .values({
          tenantId: mouvement.tenantId,
          logementId: mouvement.logementId,
          consommableId: mouvement.consommableId,
          type: mouvement.type,
          quantite: mouvement.quantite,
          avant: mouvement.avant,
          apres: mouvement.apres,
          qui: mouvement.qui,
          ref: mouvement.ref,
        })
        .onConflictDoNothing({
          target: [mouvementsStock.tenantId, mouvementsStock.ref],
        });
    });
  }
}
