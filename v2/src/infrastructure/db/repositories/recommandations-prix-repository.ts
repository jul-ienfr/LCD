import { and, asc, eq, gte, inArray, lt, lte, sql } from "drizzle-orm";
import type {
  EnregistrerRecommandationData,
  FiltreRecommandations,
  RecommandationPrixEnregistree,
  RecommandationsPrixRepository,
} from "@/application/ports/recommandations-prix-repository";
import type {
  FacteurPrix,
  SourcePrix,
  StatutRecommandation,
} from "@/domain/recommandation-prix";
import { withTenant } from "../client";
import { recommandationsPrix } from "../schema";

function versRecommandation(
  row: typeof recommandationsPrix.$inferSelect,
): RecommandationPrixEnregistree {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    jour: row.jour,
    prixActuelCentimes: row.prixActuelCentimes,
    prixRecommandeCentimes: row.prixRecommandeCentimes,
    source: row.source as SourcePrix,
    confiance: row.confiance,
    facteurs: (row.facteurs ?? []) as FacteurPrix[],
    statut: row.statut as StatutRecommandation,
    importeeLe: row.importeeLe.toISOString(),
    appliqueeLe: row.appliqueeLe?.toISOString() ?? null,
    appliqueePar: row.appliqueePar,
  };
}

export class DrizzleRecommandationsPrixRepository
  implements RecommandationsPrixRepository
{
  async enregistrerImport(
    tenantId: string,
    recommandations: EnregistrerRecommandationData[],
  ): Promise<number> {
    if (recommandations.length === 0) return 0;
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .insert(recommandationsPrix)
        .values(
          recommandations.map((entree) => ({
            tenantId,
            logementId: entree.logementId,
            jour: entree.jour,
            prixActuelCentimes: entree.prixActuelCentimes,
            prixRecommandeCentimes: entree.prixRecommandeCentimes,
            source: entree.source,
            confiance: entree.confiance,
            facteurs: entree.facteurs,
            importeeLe: new Date(entree.importeeLe),
          })),
        )
        .onConflictDoUpdate({
          target: [
            recommandationsPrix.tenantId,
            recommandationsPrix.logementId,
            recommandationsPrix.jour,
            recommandationsPrix.source,
          ],
          set: {
            prixActuelCentimes: sql`excluded.prix_actuel_centimes`,
            prixRecommandeCentimes: sql`excluded.prix_recommande_centimes`,
            confiance: sql`excluded.confiance`,
            facteurs: sql`excluded.facteurs`,
            importeeLe: sql`excluded.importee_le`,
            // Le statut n'est pas réécrit : un nouvel import ne remet pas en
            // cause une décision humaine (appliquée ou ignorée).
            updatedAt: new Date(),
          },
        })
        .returning({ id: recommandationsPrix.id });
      return rows.length;
    });
  }

  async listerParPlage(
    tenantId: string,
    filtre: FiltreRecommandations,
  ): Promise<RecommandationPrixEnregistree[]> {
    return withTenant(tenantId, async (tx) => {
      const conditions = [eq(recommandationsPrix.tenantId, tenantId)];
      if (filtre.logementId) {
        conditions.push(eq(recommandationsPrix.logementId, filtre.logementId));
      }
      if (filtre.debut) {
        conditions.push(gte(recommandationsPrix.jour, filtre.debut));
      }
      if (filtre.fin) {
        conditions.push(lte(recommandationsPrix.jour, filtre.fin));
      }
      if (filtre.statut) {
        conditions.push(eq(recommandationsPrix.statut, filtre.statut));
      }
      const rows = await tx
        .select()
        .from(recommandationsPrix)
        .where(and(...conditions))
        .orderBy(asc(recommandationsPrix.jour))
        .limit(500);
      return rows.map(versRecommandation);
    });
  }

  async trouverParJour(
    tenantId: string,
    logementId: string,
    jour: string,
    source: SourcePrix = "partenaire",
  ): Promise<RecommandationPrixEnregistree | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(recommandationsPrix)
        .where(
          and(
            eq(recommandationsPrix.tenantId, tenantId),
            eq(recommandationsPrix.logementId, logementId),
            eq(recommandationsPrix.jour, jour),
            eq(recommandationsPrix.source, source),
          ),
        )
        .limit(1);
      return row ? versRecommandation(row) : null;
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<RecommandationPrixEnregistree | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(recommandationsPrix)
        .where(
          and(
            eq(recommandationsPrix.tenantId, tenantId),
            eq(recommandationsPrix.id, id),
          ),
        )
        .limit(1);
      return row ? versRecommandation(row) : null;
    });
  }

  async marquerStatut(
    tenantId: string,
    id: string,
    statut: StatutRecommandation,
    par: string | null = null,
  ): Promise<RecommandationPrixEnregistree | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(recommandationsPrix)
        .set({
          statut,
          appliqueeLe: statut === "appliquee" ? new Date() : null,
          appliqueePar: statut === "appliquee" ? par : null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(recommandationsPrix.tenantId, tenantId),
            eq(recommandationsPrix.id, id),
          ),
        )
        .returning();
      return row ? versRecommandation(row) : null;
    });
  }

  async prixAppliquesParJour(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
  ): Promise<Map<string, number>> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select({
          jour: recommandationsPrix.jour,
          prix: recommandationsPrix.prixRecommandeCentimes,
        })
        .from(recommandationsPrix)
        .where(
          and(
            eq(recommandationsPrix.tenantId, tenantId),
            eq(recommandationsPrix.logementId, logementId),
            eq(recommandationsPrix.statut, "appliquee"),
            gte(recommandationsPrix.jour, debut),
            lt(recommandationsPrix.jour, fin),
            inArray(recommandationsPrix.source, ["partenaire", "local"]),
          ),
        )
        .orderBy(asc(recommandationsPrix.jour), asc(recommandationsPrix.confiance));
      const index = new Map<string, number>();
      // Un même jour peut avoir une recommandation locale et une partenaire :
      // la plus confiante (écrite en dernier) gagne.
      for (const row of rows) index.set(row.jour, row.prix);
      return index;
    });
  }
}
