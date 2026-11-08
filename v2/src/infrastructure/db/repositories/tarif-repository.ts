import { and, eq, gte, isNull, lte, sql } from "drizzle-orm";
import type {
  DefinirTarifData,
  TarifRepository,
} from "@/application/ports/tarif-repository";
import type { Tarif } from "@/domain/tarif";
import { withTenant } from "../client";
import { tarifs } from "../schema";

function versDomaine(row: typeof tarifs.$inferSelect): Tarif {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    planTarifaireId: row.planTarifaireId,
    date: row.date,
    prixCentimes: row.prixCentimes,
    prixParPersonneCentimes: row.prixParPersonneCentimes ?? null,
    personnesIncluses: row.personnesIncluses,
    source: row.source,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleTarifRepository implements TarifRepository {
  async definir(data: DefinirTarifData): Promise<Tarif> {
    const planTarifaireId = data.planTarifaireId ?? null;
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(tarifs)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          planTarifaireId,
          date: data.date,
          prixCentimes: data.prixCentimes,
          prixParPersonneCentimes: data.prixParPersonneCentimes ?? null,
          personnesIncluses: data.personnesIncluses ?? 2,
          source: data.source ?? "manuel",
        })
        .onConflictDoUpdate({
          target: planTarifaireId
            ? [
                tarifs.tenantId,
                tarifs.logementId,
                tarifs.planTarifaireId,
                tarifs.date,
              ]
            : [tarifs.tenantId, tarifs.logementId, tarifs.date],
          targetWhere: planTarifaireId
            ? sql`${tarifs.planTarifaireId} is not null`
            : sql`${tarifs.planTarifaireId} is null`,
          set: {
            prixCentimes: data.prixCentimes,
            prixParPersonneCentimes: data.prixParPersonneCentimes ?? null,
            personnesIncluses: data.personnesIncluses ?? 2,
            source: data.source ?? "manuel",
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!row) throw new Error("Tarif : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async definirPlusieurs(
    data: readonly DefinirTarifData[],
  ): Promise<Tarif[]> {
    if (data.length === 0) return [];
    const groupes = new Map<string | null, DefinirTarifData[]>();
    for (const entree of data) {
      const planTarifaireId = entree.planTarifaireId ?? null;
      const groupe = groupes.get(planTarifaireId) ?? [];
      groupe.push(entree);
      groupes.set(planTarifaireId, groupe);
    }

    const resultats: Tarif[] = [];
    for (const [planTarifaireId, entrees] of groupes) {
      const rows = await withTenant(entrees[0]!.tenantId, async (tx) =>
        tx
          .insert(tarifs)
          .values(
            entrees.map((entree) => ({
              tenantId: entree.tenantId,
              logementId: entree.logementId,
              planTarifaireId,
              date: entree.date,
              prixCentimes: entree.prixCentimes,
              prixParPersonneCentimes: entree.prixParPersonneCentimes ?? null,
              personnesIncluses: entree.personnesIncluses ?? 2,
              source: entree.source ?? "manuel",
            })),
          )
          .onConflictDoUpdate({
            target: planTarifaireId
              ? [
                  tarifs.tenantId,
                  tarifs.logementId,
                  tarifs.planTarifaireId,
                  tarifs.date,
                ]
              : [tarifs.tenantId, tarifs.logementId, tarifs.date],
            targetWhere: planTarifaireId
              ? sql`${tarifs.planTarifaireId} is not null`
              : sql`${tarifs.planTarifaireId} is null`,
            set: {
              prixCentimes: sql`excluded.prix_centimes`,
              prixParPersonneCentimes: sql`excluded.prix_par_personne_centimes`,
              personnesIncluses: sql`excluded.personnes_incluses`,
              source: sql`excluded.source`,
              updatedAt: new Date(),
            },
          })
          .returning(),
      );
      resultats.push(...rows.map(versDomaine));
    }
    return resultats;
  }

  async listerParMois(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
    planTarifaireId: string | null = null,
  ): Promise<Tarif[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(tarifs)
        .where(
          and(
            eq(tarifs.tenantId, tenantId),
            eq(tarifs.logementId, logementId),
            planTarifaireId
              ? eq(tarifs.planTarifaireId, planTarifaireId)
              : isNull(tarifs.planTarifaireId),
            gte(tarifs.date, debut),
            lte(tarifs.date, fin),
          ),
        );
      return rows.map(versDomaine);
    });
  }

  async trouver(
    tenantId: string,
    logementId: string,
    date: string,
    planTarifaireId: string | null = null,
  ): Promise<Tarif | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(tarifs)
        .where(
          and(
            eq(tarifs.tenantId, tenantId),
            eq(tarifs.logementId, logementId),
            planTarifaireId
              ? eq(tarifs.planTarifaireId, planTarifaireId)
              : isNull(tarifs.planTarifaireId),
            eq(tarifs.date, date),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }
}
