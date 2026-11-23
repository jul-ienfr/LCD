/**
 * Pagination des listes (spec 006, FR-026).
 *
 * Toute liste lue en base passe par ces bornes : la page demandée est
 * ramenée dans un intervalle sûr avant d'être traduite en `limit`/`offset`
 * SQL. Les valeurs aberrantes (négatives, décimales, énormes) ne doivent
 * jamais produire une requête qui charge le tenant entier.
 */

export const TAILLE_PAGE_DEFAUT = 50;
export const TAILLE_PAGE_MAX = 200;

export interface PageBornee {
  /** Numéro de page, à partir de 1. */
  page: number;
  /** Nombre de lignes par page, entre 1 et TAILLE_PAGE_MAX. */
  taille: number;
  /** Décalage SQL (`offset`). */
  decalage: number;
}

function entierPositif(valeur: unknown, defaut: number): number {
  if (typeof valeur !== "number" || !Number.isFinite(valeur)) return defaut;
  return Math.trunc(valeur);
}

/** Borne une page et une taille demandées avant de construire le SQL. */
export function bornerPage(
  page: unknown,
  taille: unknown = TAILLE_PAGE_DEFAUT,
): PageBornee {
  const pageSure = Math.max(1, entierPositif(page, 1));
  const tailleSure = Math.min(
    TAILLE_PAGE_MAX,
    Math.max(1, entierPositif(taille, TAILLE_PAGE_DEFAUT)),
  );
  return {
    page: pageSure,
    taille: tailleSure,
    decalage: (pageSure - 1) * tailleSure,
  };
}

/** Nombre de pages pour un total donné (au moins 1, jamais 0). */
export function nombreDePages(total: number, taille: number): number {
  const totalSur = Math.max(0, Math.trunc(total));
  const tailleSure = Math.max(1, Math.trunc(taille));
  return Math.max(1, Math.ceil(totalSur / tailleSure));
}
