import { and, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import type { RestrictionSejourRepository } from "@/application/ports/restriction-sejour-repository";
import type {
  RestrictionSejour,
  ValeursRestrictionSejour,
} from "@/domain/restriction-sejour";
import { withTenant } from "../client";
import { restrictionsSejour } from "../schema";

function versDomaine(
  row: typeof restrictionsSejour.$inferSelect,
): RestrictionSejour {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    planTarifaireId: row.planTarifaireId,
    date: row.date,
    sejourMin: row.sejourMin,
    sejourMax: row.sejourMax,
    arriveeAutorisee: row.arriveeAutorisee,
    departAutorisee: row.departAutorisee,
    stopSell: row.stopSell,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleRestrictionSejourRepository
  implements RestrictionSejourRepository
{
  async listerParPeriode(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
    planTarifaireId: string | null = null,
  ): Promise<RestrictionSejour[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(restrictionsSejour)
        .where(
          and(
            eq(restrictionsSejour.tenantId, tenantId),
            eq(restrictionsSejour.logementId, logementId),
            planTarifaireId
              ? eq(restrictionsSejour.planTarifaireId, planTarifaireId)
              : isNull(restrictionsSejour.planTarifaireId),
            gte(restrictionsSejour.date, debut),
            lte(restrictionsSejour.date, fin),
          ),
        )
        .orderBy(restrictionsSejour.date);
      return rows.map(versDomaine);
    });
  }

  async enregistrer(
    tenantId: string,
    logementId: string,
    valeurs: ValeursRestrictionSejour,
    planTarifaireId: string | null = null,
  ): Promise<RestrictionSejour> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .insert(restrictionsSejour)
        .values({
          tenantId,
          logementId,
          planTarifaireId,
          date: valeurs.date,
          sejourMin: valeurs.sejourMin,
          sejourMax: valeurs.sejourMax,
          arriveeAutorisee: valeurs.arriveeAutorisee,
          departAutorisee: valeurs.departAutorisee,
          stopSell: valeurs.stopSell,
        })
        .onConflictDoUpdate({
          target: planTarifaireId
            ? [
                restrictionsSejour.tenantId,
                restrictionsSejour.logementId,
                restrictionsSejour.planTarifaireId,
                restrictionsSejour.date,
              ]
            : [
                restrictionsSejour.tenantId,
                restrictionsSejour.logementId,
                restrictionsSejour.date,
              ],
          targetWhere: planTarifaireId
            ? sql`${restrictionsSejour.planTarifaireId} is not null`
            : sql`${restrictionsSejour.planTarifaireId} is null`,
          set: {
            sejourMin: valeurs.sejourMin,
            sejourMax: valeurs.sejourMax,
            arriveeAutorisee: valeurs.arriveeAutorisee,
            departAutorisee: valeurs.departAutorisee,
            stopSell: valeurs.stopSell,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!row) throw new Error("Restriction : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async enregistrerPlusieurs(
    tenantId: string,
    logementId: string,
    valeurs: readonly ValeursRestrictionSejour[],
    planTarifaireId: string | null = null,
  ): Promise<RestrictionSejour[]> {
    if (valeurs.length === 0) return [];
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .insert(restrictionsSejour)
        .values(
          valeurs.map((valeur) => ({
            tenantId,
            logementId,
            planTarifaireId,
            date: valeur.date,
            sejourMin: valeur.sejourMin,
            sejourMax: valeur.sejourMax,
            arriveeAutorisee: valeur.arriveeAutorisee,
            departAutorisee: valeur.departAutorisee,
            stopSell: valeur.stopSell,
          })),
        )
        .onConflictDoUpdate({
          target: planTarifaireId
            ? [
                restrictionsSejour.tenantId,
                restrictionsSejour.logementId,
                restrictionsSejour.planTarifaireId,
                restrictionsSejour.date,
              ]
            : [
                restrictionsSejour.tenantId,
                restrictionsSejour.logementId,
                restrictionsSejour.date,
              ],
          targetWhere: planTarifaireId
            ? sql`${restrictionsSejour.planTarifaireId} is not null`
            : sql`${restrictionsSejour.planTarifaireId} is null`,
          set: {
            sejourMin: sql`excluded.sejour_min`,
            sejourMax: sql`excluded.sejour_max`,
            arriveeAutorisee: sql`excluded.arrivee_autorisee`,
            departAutorisee: sql`excluded.depart_autorisee`,
            stopSell: sql`excluded.stop_sell`,
            updatedAt: new Date(),
          },
        })
        .returning();
      return rows.map(versDomaine);
    });
  }

  async supprimer(
    tenantId: string,
    logementId: string,
    date: string,
    planTarifaireId: string | null = null,
  ): Promise<void> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .delete(restrictionsSejour)
        .where(
          and(
            eq(restrictionsSejour.tenantId, tenantId),
            eq(restrictionsSejour.logementId, logementId),
            planTarifaireId
              ? eq(restrictionsSejour.planTarifaireId, planTarifaireId)
              : isNull(restrictionsSejour.planTarifaireId),
            eq(restrictionsSejour.date, date),
          ),
        );
    });
  }

  async supprimerPlusieurs(
    tenantId: string,
    logementId: string,
    dates: readonly string[],
    planTarifaireId: string | null = null,
  ): Promise<void> {
    if (dates.length === 0) return;
    await withTenant(tenantId, async (tx) => {
      await tx
        .delete(restrictionsSejour)
        .where(
          and(
            eq(restrictionsSejour.tenantId, tenantId),
            eq(restrictionsSejour.logementId, logementId),
            planTarifaireId
              ? eq(restrictionsSejour.planTarifaireId, planTarifaireId)
              : isNull(restrictionsSejour.planTarifaireId),
            inArray(restrictionsSejour.date, [...dates]),
          ),
        );
    });
  }
}
