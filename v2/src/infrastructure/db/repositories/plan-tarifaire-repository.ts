import { and, asc, eq } from "drizzle-orm";
import type {
  CreerPlanTarifaireData,
  MettreAJourPlanTarifaireData,
  PlanTarifaireRepository,
} from "@/application/ports/plan-tarifaire-repository";
import { ErreurMetier } from "@/domain/erreurs";
import type {
  ModePlanTarifaire,
  PlanTarifaire,
} from "@/domain/plan-tarifaire";
import { withTenant } from "../client";
import { plansTarifaires } from "../schema";

function versDomaine(
  row: typeof plansTarifaires.$inferSelect,
): PlanTarifaire {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    nom: row.nom,
    code: row.code,
    externalRatePlanId: row.externalRatePlanId,
    mode: row.mode as ModePlanTarifaire,
    ajustementPourcentage: row.ajustementPourcentage,
    heriteRestrictions: row.heriteRestrictions,
    priorite: row.priorite,
    actif: row.actif,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function codePostgres(erreur: unknown): string | undefined {
  if (typeof erreur !== "object" || erreur === null) return undefined;
  const direct = (erreur as { code?: unknown }).code;
  if (typeof direct === "string") return direct;
  const cause = (erreur as { cause?: unknown }).cause;
  if (typeof cause === "object" && cause !== null) {
    const codeCause = (cause as { code?: unknown }).code;
    if (typeof codeCause === "string") return codeCause;
  }
  return undefined;
}

export class DrizzlePlanTarifaireRepository
  implements PlanTarifaireRepository
{
  async listerParLogement(
    tenantId: string,
    logementId: string,
    actifsSeulement = false,
  ): Promise<PlanTarifaire[]> {
    return withTenant(tenantId, async (tx) => {
      const conditions = [
        eq(plansTarifaires.tenantId, tenantId),
        eq(plansTarifaires.logementId, logementId),
      ];
      if (actifsSeulement) conditions.push(eq(plansTarifaires.actif, true));
      const rows = await tx
        .select()
        .from(plansTarifaires)
        .where(and(...conditions))
        .orderBy(
          asc(plansTarifaires.priorite),
          asc(plansTarifaires.nom),
        );
      return rows.map(versDomaine);
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<PlanTarifaire | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(plansTarifaires)
        .where(
          and(
            eq(plansTarifaires.tenantId, tenantId),
            eq(plansTarifaires.id, id),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async creer(data: CreerPlanTarifaireData): Promise<PlanTarifaire> {
    try {
      return await withTenant(data.tenantId, async (tx) => {
        const [row] = await tx
          .insert(plansTarifaires)
          .values({
            tenantId: data.tenantId,
            logementId: data.logementId,
            nom: data.nom,
            code: data.code,
            externalRatePlanId: data.externalRatePlanId ?? null,
            mode: data.mode ?? "independant",
            ajustementPourcentage: data.ajustementPourcentage ?? 0,
            heriteRestrictions: data.heriteRestrictions ?? true,
            priorite: data.priorite ?? 0,
            actif: data.actif ?? true,
          })
          .returning();
        if (!row) throw new Error("Plan tarifaire : aucune ligne retournée.");
        return versDomaine(row);
      });
    } catch (erreur) {
      if (codePostgres(erreur) === "23505") {
        throw new ErreurMetier(
          "PLAN_TARIFAIRE_INVALIDE",
          "Un plan avec ce code existe déjà pour ce logement.",
        );
      }
      throw erreur;
    }
  }

  async mettreAJour(
    tenantId: string,
    id: string,
    data: MettreAJourPlanTarifaireData,
  ): Promise<PlanTarifaire | null> {
    const valeurs: Partial<typeof plansTarifaires.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (data.nom !== undefined) valeurs.nom = data.nom;
    if (data.externalRatePlanId !== undefined) {
      valeurs.externalRatePlanId = data.externalRatePlanId;
    }
    if (data.mode !== undefined) valeurs.mode = data.mode;
    if (data.ajustementPourcentage !== undefined) {
      valeurs.ajustementPourcentage = data.ajustementPourcentage;
    }
    if (data.heriteRestrictions !== undefined) {
      valeurs.heriteRestrictions = data.heriteRestrictions;
    }
    if (data.priorite !== undefined) valeurs.priorite = data.priorite;
    if (data.actif !== undefined) valeurs.actif = data.actif;

    await withTenant(tenantId, async (tx) => {
      await tx
        .update(plansTarifaires)
        .set(valeurs)
        .where(
          and(
            eq(plansTarifaires.tenantId, tenantId),
            eq(plansTarifaires.id, id),
          ),
        );
    });
    return this.trouverParId(tenantId, id);
  }

  async supprimer(tenantId: string, id: string): Promise<boolean> {
    try {
      return await withTenant(tenantId, async (tx) => {
        const rows = await tx
          .delete(plansTarifaires)
          .where(
            and(
              eq(plansTarifaires.tenantId, tenantId),
              eq(plansTarifaires.id, id),
            ),
          )
          .returning({ id: plansTarifaires.id });
        return rows.length > 0;
      });
    } catch (erreur) {
      if (["23503", "23001"].includes(codePostgres(erreur) ?? "")) {
        throw new ErreurMetier(
          "PLAN_TARIFAIRE_INVALIDE",
          "Ce plan porte encore des tarifs ou des restrictions : supprimez-les d’abord.",
        );
      }
      throw erreur;
    }
  }
}
