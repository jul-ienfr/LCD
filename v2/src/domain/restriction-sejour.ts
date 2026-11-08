import { ajouterJours, dateIsoValide, nuitsEntre } from "./calendrier";
import { ErreurMetier } from "./erreurs";

export const SEJOUR_NUITS_MAX = 365;
export const PLAGE_JOURS_MAX = 366;

const JOUR_MS = 86_400_000;

export type JourSemaine = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export function datesPlage(
  debut: string,
  fin: string,
  joursSemaine: readonly number[] = [],
): string[] {
  if (!dateIsoValide(debut) || !dateIsoValide(fin)) {
    throw new ErreurMetier(
      "RESTRICTION_SEJOUR_INVALIDE",
      "La plage de dates est invalide.",
    );
  }
  if (fin < debut) {
    throw new ErreurMetier(
      "RESTRICTION_SEJOUR_INVALIDE",
      "La date de fin ne peut pas précéder la date de début.",
    );
  }
  const debutMs = Date.parse(`${debut}T00:00:00.000Z`);
  const finMs = Date.parse(`${fin}T00:00:00.000Z`);
  const nombreJours = Math.round((finMs - debutMs) / JOUR_MS) + 1;
  if (nombreJours > PLAGE_JOURS_MAX) {
    throw new ErreurMetier(
      "RESTRICTION_SEJOUR_INVALIDE",
      `La plage ne peut pas dépasser ${PLAGE_JOURS_MAX} jours.`,
    );
  }
  const filtres = new Set(joursSemaine);
  if (
    [...filtres].some(
      (jour) => !Number.isInteger(jour) || jour < 1 || jour > 7,
    )
  ) {
    throw new ErreurMetier(
      "RESTRICTION_SEJOUR_INVALIDE",
      "Les jours de semaine sont invalides.",
    );
  }
  const dates: string[] = [];
  for (let index = 0; index < nombreJours; index += 1) {
    const date = new Date(debutMs + index * JOUR_MS);
    const jour = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
    if (filtres.size > 0 && !filtres.has(jour)) continue;
    dates.push(date.toISOString().slice(0, 10));
  }
  return dates;
}

export interface RestrictionSejour {
  id: string;
  tenantId: string;
  logementId: string;
  planTarifaireId?: string | null;
  date: string;
  sejourMin: number | null;
  sejourMax: number | null;
  arriveeAutorisee: boolean | null;
  departAutorisee: boolean | null;
  stopSell: boolean | null;
  updatedAt: Date;
}

export interface ValeursRestrictionSejour {
  date: string;
  sejourMin: number | null;
  sejourMax: number | null;
  arriveeAutorisee: boolean | null;
  departAutorisee: boolean | null;
  stopSell: boolean | null;
}

/**
 * Vérifie qu'un séjour respecte les règles de base : dates vendues, arrivée et
 * départ autorisés, durée minimale et maximale. Renvoie null si tout est permis.
 */
export function motifSejourRefuse(
  restrictions: readonly RestrictionSejour[],
  debut: string,
  fin: string,
): string | null {
  if (
    !dateIsoValide(debut) ||
    !dateIsoValide(fin) ||
    fin <= debut
  ) {
    return "Les dates du séjour sont invalides.";
  }
  const parDate = new Map(restrictions.map((regle) => [regle.date, regle]));
  const nuits = nuitsEntre(debut, fin);
  let sejourMin = 0;
  let sejourMax = Number.POSITIVE_INFINITY;

  for (let index = 0; index < nuits; index += 1) {
    const regle = parDate.get(ajouterJours(debut, index));
    if (!regle) continue;
    if (regle.stopSell === true) {
      return `La nuit du ${regle.date} n’est pas ouverte à la réservation.`;
    }
    if (regle.sejourMin !== null) {
      sejourMin = Math.max(sejourMin, regle.sejourMin);
    }
    if (regle.sejourMax !== null) {
      sejourMax = Math.min(sejourMax, regle.sejourMax);
    }
  }

  if (parDate.get(debut)?.arriveeAutorisee === false) {
    return `Les arrivées ne sont pas autorisées le ${debut}.`;
  }
  if (parDate.get(fin)?.departAutorisee === false) {
    return `Les départs ne sont pas autorisés le ${fin}.`;
  }
  if (sejourMin > 0 && nuits < sejourMin) {
    return `Ce séjour de ${nuits} nuit${nuits > 1 ? "s" : ""} est trop court : minimum ${sejourMin} nuits.`;
  }
  if (Number.isFinite(sejourMax) && nuits > sejourMax) {
    return `Ce séjour de ${nuits} nuits dépasse le maximum de ${sejourMax} nuits.`;
  }
  return null;
}

function nuitsValides(
  valeur: number | null,
  libelle: string,
): number | null {
  if (valeur === null) return null;
  if (
    !Number.isInteger(valeur) ||
    valeur < 1 ||
    valeur > SEJOUR_NUITS_MAX
  ) {
    throw new ErreurMetier(
      "RESTRICTION_SEJOUR_INVALIDE",
      `${libelle} doit être comprise entre 1 et ${SEJOUR_NUITS_MAX} nuits.`,
    );
  }
  return valeur;
}

export function validerRestrictionSejour(input: {
  date: string;
  sejourMin: number | null;
  sejourMax: number | null;
  arriveeAutorisee: boolean | null;
  departAutorisee: boolean | null;
  stopSell: boolean | null;
}): ValeursRestrictionSejour {
  if (!dateIsoValide(input.date)) {
    throw new ErreurMetier(
      "RESTRICTION_SEJOUR_INVALIDE",
      "La date de la règle est invalide.",
    );
  }
  const sejourMin = nuitsValides(input.sejourMin, "La durée minimale");
  const sejourMax = nuitsValides(input.sejourMax, "La durée maximale");
  if (sejourMin !== null && sejourMax !== null && sejourMin > sejourMax) {
    throw new ErreurMetier(
      "RESTRICTION_SEJOUR_INVALIDE",
      "La durée minimale ne peut pas dépasser la durée maximale.",
    );
  }
  return {
    date: input.date,
    sejourMin,
    sejourMax,
    arriveeAutorisee: input.arriveeAutorisee,
    departAutorisee: input.departAutorisee,
    stopSell: input.stopSell,
  };
}

export function restrictionVide(
  valeurs: ValeursRestrictionSejour,
): boolean {
  return (
    valeurs.sejourMin === null &&
    valeurs.sejourMax === null &&
    valeurs.arriveeAutorisee === null &&
    valeurs.departAutorisee === null &&
    valeurs.stopSell === null
  );
}

export function decrireRestriction(
  restriction: Pick<
    RestrictionSejour,
    | "sejourMin"
    | "sejourMax"
    | "arriveeAutorisee"
    | "departAutorisee"
    | "stopSell"
  >,
): string {
  const morceaux: string[] = [];
  if (restriction.sejourMin !== null) {
    morceaux.push(`min ${restriction.sejourMin} nuit${restriction.sejourMin > 1 ? "s" : ""}`);
  }
  if (restriction.sejourMax !== null) {
    morceaux.push(`max ${restriction.sejourMax} nuit${restriction.sejourMax > 1 ? "s" : ""}`);
  }
  if (restriction.arriveeAutorisee === false) morceaux.push("arrivée interdite");
  if (restriction.departAutorisee === false) morceaux.push("départ interdit");
  if (restriction.stopSell === true) morceaux.push("vente arrêtée");
  return morceaux.join(" · ");
}
