import { and, asc, eq, isNull, or } from "drizzle-orm";
import type { LieuxTourismeRepository } from "@/application/ports/lieux-tourisme-repository";
import type {
  CategorieLieu,
  LieuTourisme,
  LieuTourismeInput,
} from "@/domain/tourisme";
import { withTenant } from "../client";
import { lieuxTourisme } from "../schema";

function versDomaine(row: typeof lieuxTourisme.$inferSelect): LieuTourisme {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    slug: row.slug,
    nom: row.nom,
    categorie: row.categorie as CategorieLieu,
    commune: row.commune,
    acces: row.acces,
    prixIndicatif: row.prixIndicatif,
    lien: row.lien,
    mode: row.mode,
    extraId: row.extraId,
    actif: row.actif,
  };
}

export class DrizzleLieuxTourismeRepository
  implements LieuxTourismeRepository
{
  async lister(
    tenantId: string,
    logementId: string,
    options?: { inclureInactifs?: boolean },
  ): Promise<LieuTourisme[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(lieuxTourisme)
        .where(
          and(
            eq(lieuxTourisme.tenantId, tenantId),
            or(
              isNull(lieuxTourisme.logementId),
              eq(lieuxTourisme.logementId, logementId),
            ),
            options?.inclureInactifs
              ? undefined
              : eq(lieuxTourisme.actif, true),
          ),
        )
        .orderBy(asc(lieuxTourisme.categorie), asc(lieuxTourisme.nom));
      return rows.map(versDomaine);
    });
  }

  async enregistrer(input: LieuTourismeInput): Promise<LieuTourisme> {
    return withTenant(input.tenantId, async (tx) => {
      const [row] = await tx
        .insert(lieuxTourisme)
        .values({
          ...(input.id ? { id: input.id } : {}),
          tenantId: input.tenantId,
          logementId: input.logementId,
          slug: input.slug,
          nom: input.nom,
          categorie: input.categorie,
          commune: input.commune,
          acces: input.acces,
          prixIndicatif: input.prixIndicatif,
          lien: input.lien,
          mode: input.mode,
          extraId: input.extraId,
          actif: input.actif ?? true,
        })
        .onConflictDoUpdate({
          target: [lieuxTourisme.tenantId, lieuxTourisme.slug],
          set: {
            logementId: input.logementId,
            nom: input.nom,
            categorie: input.categorie,
            commune: input.commune,
            acces: input.acces,
            prixIndicatif: input.prixIndicatif,
            lien: input.lien,
            mode: input.mode,
            extraId: input.extraId,
            actif: input.actif ?? true,
            updatedAt: new Date(),
          },
        })
        .returning();
      if (!row) throw new Error("Lieu : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async desactiver(tenantId: string, slug: string): Promise<void> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(lieuxTourisme)
        .set({ actif: false, updatedAt: new Date() })
        .where(
          and(
            eq(lieuxTourisme.tenantId, tenantId),
            eq(lieuxTourisme.slug, slug),
          ),
        );
    });
  }
}
