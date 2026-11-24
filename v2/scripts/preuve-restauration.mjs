#!/usr/bin/env node
/**
 * Preuve datée de la restauration de contrôle et des objectifs RTO/RPO
 * (spec 006, FR-008 et FR-009).
 *
 * Le RTO est la durée réelle de la restauration ; le RPO est l'âge de la
 * sauvegarde restaurée au moment du contrôle. Une preuve n'est conforme que si
 * la restauration a réussi et que les deux objectifs sont tenus.
 */

export const RTO_MAX_MINUTES = 30;
export const RPO_MAX_HEURES = 24;

/**
 * @param {{dureeMs: number, ageSauvegardeHeures: number, rtoMaxMinutes?: number, rpoMaxHeures?: number}} entree
 * @returns {{rtoConforme: boolean, rpoConforme: boolean, conforme: boolean}}
 */
export function evaluerObjectifs(entree) {
  const rtoMaxMinutes = entree.rtoMaxMinutes ?? RTO_MAX_MINUTES;
  const rpoMaxHeures = entree.rpoMaxHeures ?? RPO_MAX_HEURES;
  const rtoConforme =
    Number.isFinite(entree.dureeMs) &&
    entree.dureeMs >= 0 &&
    entree.dureeMs <= rtoMaxMinutes * 60_000;
  const rpoConforme =
    Number.isFinite(entree.ageSauvegardeHeures) &&
    entree.ageSauvegardeHeures >= 0 &&
    entree.ageSauvegardeHeures <= rpoMaxHeures;
  return { rtoConforme, rpoConforme, conforme: rtoConforme && rpoConforme };
}

/**
 * @param {object} entree
 * @param {string|null} entree.fichier
 * @param {string} entree.demarreLe
 * @param {number} entree.dureeMs
 * @param {number|null} entree.ageSauvegardeHeures
 * @param {object|null} entree.comptes
 * @param {boolean} entree.ok
 * @param {string|null} entree.erreur
 * @param {number} [entree.rtoMaxMinutes]
 * @param {number} [entree.rpoMaxHeures]
 * @returns {object} preuve JSON prête à écrire
 */
export function construirePreuveRestauration(entree) {
  const objectifs = evaluerObjectifs({
    dureeMs: entree.dureeMs,
    ageSauvegardeHeures:
      entree.ageSauvegardeHeures === null ? Number.NaN : entree.ageSauvegardeHeures,
    rtoMaxMinutes: entree.rtoMaxMinutes,
    rpoMaxHeures: entree.rpoMaxHeures,
  });
  return {
    version: 1,
    ok: entree.ok === true && objectifs.conforme,
    fichier: entree.fichier,
    demarreLe: entree.demarreLe,
    verifieLe: new Date().toISOString(),
    dureeMs: entree.dureeMs,
    ageSauvegardeHeures: entree.ageSauvegardeHeures,
    rtoMaxMinutes: entree.rtoMaxMinutes ?? RTO_MAX_MINUTES,
    rpoMaxHeures: entree.rpoMaxHeures ?? RPO_MAX_HEURES,
    ...objectifs,
    comptes: entree.comptes,
    erreur: entree.erreur ?? null,
  };
}
