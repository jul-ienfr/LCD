import { and, eq } from "drizzle-orm";
import type {
  AnnoncesConformiteRepository,
  EnregistrerConformiteData,
} from "@/application/ports/annonces-conformite-repository";
import type {
  ClassementMeuble,
  ConformiteAnnonce,
  EtiquetteEnergie,
} from "@/domain/annonce";
import { withTenant } from "../client";
import { annoncesConformite } from "../schema";

function versDomaine(
  row: typeof annoncesConformite.$inferSelect,
): ConformiteAnnonce {
  return {
    tenantId: row.tenantId,
    logementId: row.logementId,
    mentions: row.mentions,
    dpeClasse: (row.dpeClasse as EtiquetteEnergie | null) ?? null,
    gesClasse: (row.gesClasse as EtiquetteEnergie | null) ?? null,
    classement: (row.classement as ClassementMeuble | null) ?? null,
    numeroEnregistrement: row.numeroEnregistrement,
    numeroCerfa: row.numeroCerfa,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleAnnoncesConformiteRepository
  implements AnnoncesConformiteRepository
{
  async trouverParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<ConformiteAnnonce | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(annoncesConformite)
        .where(
          and(
            eq(annoncesConformite.tenantId, tenantId),
            eq(annoncesConformite.logementId, logementId),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async enregistrer(
    data: EnregistrerConformiteData,
  ): Promise<ConformiteAnnonce> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(annoncesConformite)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          mentions: data.mentions,
          dpeClasse: data.dpeClasse,
          gesClasse: data.gesClasse,
          classement: data.classement,
          numeroEnregistrement: data.numeroEnregistrement,
          numeroCerfa: data.numeroCerfa,
        })
        .onConflictDoUpdate({
          target: [
            annoncesConformite.tenantId,
            annoncesConformite.logementId,
          ],
          set: {
            mentions: data.mentions,
            dpeClasse: data.dpeClasse,
            gesClasse: data.gesClasse,
            classement: data.classement,
            numeroEnregistrement: data.numeroEnregistrement,
            numeroCerfa: data.numeroCerfa,
            updatedAt: new Date(),
          },
        })
        .returning();
      if (!row) throw new Error("Conformité annonce : aucune ligne retournée.");
      return versDomaine(row);
    });
  }
}
