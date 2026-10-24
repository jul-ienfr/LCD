import { eq } from "drizzle-orm";
import type { ParametresFiscauxRepository } from "@/application/ports/parametres-fiscaux-repository";
import type { ParametresFiscaux } from "@/domain/fiscal";
import { withTenant } from "../client";
import { parametresFiscaux } from "../schema";

function versDomaine(
  row: typeof parametresFiscaux.$inferSelect,
): ParametresFiscaux {
  return {
    tenantId: row.tenantId,
    tauxTvaBp: row.tauxTvaBp,
    taxeSejourNuitPersonneCentimes: row.taxeSejourNuitPersonneCentimes,
    taxeSejourPlafondCentimes: row.taxeSejourPlafondCentimes,
    prefixeFacture: row.prefixeFacture,
    mentionsLegales: row.mentionsLegales,
  };
}

export class DrizzleParametresFiscauxRepository
  implements ParametresFiscauxRepository
{
  async trouver(tenantId: string): Promise<ParametresFiscaux | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(parametresFiscaux)
        .where(eq(parametresFiscaux.tenantId, tenantId))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async enregistrer(params: ParametresFiscaux): Promise<ParametresFiscaux> {
    return withTenant(params.tenantId, async (tx) => {
      const [row] = await tx
        .insert(parametresFiscaux)
        .values({
          tenantId: params.tenantId,
          tauxTvaBp: params.tauxTvaBp,
          taxeSejourNuitPersonneCentimes:
            params.taxeSejourNuitPersonneCentimes,
          taxeSejourPlafondCentimes: params.taxeSejourPlafondCentimes,
          prefixeFacture: params.prefixeFacture,
          mentionsLegales: params.mentionsLegales,
        })
        .onConflictDoUpdate({
          target: parametresFiscaux.tenantId,
          set: {
            tauxTvaBp: params.tauxTvaBp,
            taxeSejourNuitPersonneCentimes:
              params.taxeSejourNuitPersonneCentimes,
            taxeSejourPlafondCentimes: params.taxeSejourPlafondCentimes,
            prefixeFacture: params.prefixeFacture,
            mentionsLegales: params.mentionsLegales,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!row) throw new Error("Paramètres fiscaux : aucune ligne retournée.");
      return versDomaine(row);
    });
  }
}
