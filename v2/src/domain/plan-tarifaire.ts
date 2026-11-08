import type { RestrictionSejour } from "./restriction-sejour";

export type PlanTarifaireId = string;
export type ModePlanTarifaire = "independant" | "derive";

/**
 * Un plan tarifaire est une déclinaison commerciale d'un logement : tarif
 * standard, non remboursable, long séjour… Le plan de base n'a pas de ligne :
 * il est représenté par `null` dans les tarifs et restrictions.
 */
export interface PlanTarifaire {
  id: PlanTarifaireId;
  tenantId: string;
  logementId: string;
  nom: string;
  code: string;
  externalRatePlanId: string | null;
  mode: ModePlanTarifaire;
  ajustementPourcentage: number;
  heriteRestrictions: boolean;
  priorite: number;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function codePlanValide(code: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/.test(code);
}

export function nomPlanValide(nom: string): boolean {
  const valeur = nom.trim();
  return valeur.length >= 2 && valeur.length <= 80;
}

export function prioritePlanValide(priorite: number): boolean {
  return Number.isInteger(priorite) && priorite >= 0 && priorite <= 1_000;
}

export function modePlanValide(mode: string): mode is ModePlanTarifaire {
  return mode === "independant" || mode === "derive";
}

export function ajustementPlanValide(ajustement: number): boolean {
  return (
    Number.isInteger(ajustement) &&
    ajustement >= -90 &&
    ajustement <= 500
  );
}

export function prixPlanDerive(
  prixBaseCentimes: number,
  ajustementPourcentage: number,
): number {
  return Math.max(
    1,
    Math.round((prixBaseCentimes * (100 + ajustementPourcentage)) / 100),
  );
}

export function fusionnerTarifsPlan(
  base: readonly { date: string; prixCentimes: number }[],
  plan: readonly { date: string; prixCentimes: number }[],
  mode: ModePlanTarifaire,
  ajustementPourcentage: number,
): { date: string; prixCentimes: number }[] {
  const parDate = new Map<string, number>();
  if (mode === "derive") {
    for (const tarif of base) {
      parDate.set(
        tarif.date,
        prixPlanDerive(tarif.prixCentimes, ajustementPourcentage),
      );
    }
  }
  for (const tarif of plan) {
    parDate.set(tarif.date, tarif.prixCentimes);
  }
  return [...parDate.entries()]
    .map(([date, prixCentimes]) => ({ date, prixCentimes }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function fusionnerRestrictionsPlan(
  base: readonly RestrictionSejour[],
  plan: readonly RestrictionSejour[],
  herite: boolean,
): RestrictionSejour[] {
  if (!herite) {
    return [...plan].sort((a, b) => a.date.localeCompare(b.date));
  }
  const parDate = new Map(base.map((restriction) => [restriction.date, restriction]));
  for (const restriction of plan) {
    const existante = parDate.get(restriction.date);
    parDate.set(
      restriction.date,
      existante
        ? {
            ...existante,
            ...restriction,
            sejourMin: restriction.sejourMin ?? existante.sejourMin,
            sejourMax: restriction.sejourMax ?? existante.sejourMax,
            arriveeAutorisee:
              restriction.arriveeAutorisee ?? existante.arriveeAutorisee,
            departAutorisee:
              restriction.departAutorisee ?? existante.departAutorisee,
            stopSell: restriction.stopSell ?? existante.stopSell,
          }
        : restriction,
    );
  }
  return [...parDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
