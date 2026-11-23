/**
 * Score par intervenant (spec 006, FR-034).
 *
 * Agrège les interventions d'une période en trois composantes — qualité des
 * preuves, ponctualité du pointage, régularité des durées — puis les combine
 * en un score sur 100. Pur : aucune horloge, aucun accès base ou réseau.
 *
 * Une composante non mesurable (aucune preuve tranchée, aucun pointage
 * comparable) vaut `null` et ne pèse pas dans le score : mieux vaut ne rien
 * dire que de noter un intervenant sur zéro donnée.
 */

import { dateIsoValide } from "./calendrier";

/** Un début pointé jusqu'à 15 min après l'heure prévue reste à l'heure. */
export const TOLERANCE_PONCTUALITE_MINUTES = 15;

/** Une durée réelle à ±30 min de la durée prévue reste conforme. */
export const TOLERANCE_ECART_DUREE_MINUTES = 30;

/** Poids des composantes dans le score, renormalisés sur celles mesurables. */
export const POIDS_COMPOSANTES = {
  qualite: 50,
  ponctualite: 25,
  regularite: 25,
} as const;

/** Une période analysée ne dépasse pas un an (garde-fou de volume). */
export const PERIODE_MAX_JOURS = 366;

export type Composante = keyof typeof POIDS_COMPOSANTES;

/** Agrégats bruts d'un intervenant sur une période, tels que lus en base. */
export interface StatsIntervenant {
  userId: string;
  /** Missions de la période assignées à l'intervenant. */
  interventions: number;
  annulees: number;
  terminees: number;
  /** Pointages début comparables à l'heure prévue (date et heure renseignées). */
  pointagesMesurables: number;
  pointagesALHeure: number;
  /** Retard moyen au début, en minutes (négatif = en avance). */
  retardMoyenMinutes: number | null;
  /** Interventions avec début et fin pointés : durée réelle comparable. */
  dureesMesurables: number;
  dureesConformes: number;
  /** Écart moyen durée réelle − durée prévue, en minutes. */
  ecartMoyenMinutes: number | null;
  /** Preuves validées du premier coup (aucun refus dans l'historique). */
  preuvesValideesSansRefus: number;
  /** Preuves refusées au moins une fois par la gérante. */
  preuvesRefuseesAuMoinsUneFois: number;
  /** Preuves en attente de décision : soumises, ou intervention terminée sans preuve. */
  preuvesEnAttente: number;
}

export interface ScoreIntervenant extends StatsIntervenant {
  /** Score global sur 100, `null` si aucune composante n'est mesurable. */
  score: number | null;
  /** Taux de preuves acceptées du premier coup, sur 100. */
  qualite: number | null;
  /** Taux de pointages à l'heure, sur 100. */
  ponctualite: number | null;
  /** Taux de durées conformes, sur 100. */
  regularite: number | null;
}

/** Taux sur 100, ou `null` quand rien n'est mesurable. */
export function taux(part: number, total: number): number | null {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) {
    return null;
  }
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

/** Score d'un intervenant : composantes mesurables, pondérées puis renormalisées. */
export function calculerScore(stats: StatsIntervenant): ScoreIntervenant {
  const qualite = taux(
    stats.preuvesValideesSansRefus,
    stats.preuvesValideesSansRefus + stats.preuvesRefuseesAuMoinsUneFois,
  );
  const ponctualite = taux(stats.pointagesALHeure, stats.pointagesMesurables);
  const regularite = taux(stats.dureesConformes, stats.dureesMesurables);

  const composantes: { poids: number; valeur: number | null }[] = [
    { poids: POIDS_COMPOSANTES.qualite, valeur: qualite },
    { poids: POIDS_COMPOSANTES.ponctualite, valeur: ponctualite },
    { poids: POIDS_COMPOSANTES.regularite, valeur: regularite },
  ];
  const mesurables = composantes.filter(
    (composante): composante is { poids: number; valeur: number } =>
      composante.valeur !== null,
  );
  const poidsTotal = mesurables.reduce((total, c) => total + c.poids, 0);
  const score =
    poidsTotal === 0
      ? null
      : Math.round(
          mesurables.reduce((total, c) => total + c.poids * c.valeur, 0) /
            poidsTotal,
        );

  return { ...stats, score, qualite, ponctualite, regularite };
}

/**
 * Ordre d'affichage : meilleur score d'abord, puis qualité, puis identifiant
 * (stable). Un intervenant sans composante mesurable reste en fin de liste.
 */
export function comparerScores(a: ScoreIntervenant, b: ScoreIntervenant): number {
  if (a.score !== b.score) {
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return b.score - a.score;
  }
  const qualiteA = a.qualite ?? -1;
  const qualiteB = b.qualite ?? -1;
  if (qualiteA !== qualiteB) return qualiteB - qualiteA;
  return a.userId.localeCompare(b.userId);
}

/** « 82/100 », ou `null` si le score n'est pas mesurable. */
export function libelleScore(score: number | null): string | null {
  return score === null ? null : `${score}/100`;
}

/** « aucun écart », « +12 min », « -8 min ». `null` = rien de mesurable. */
export function formaterEcartMoyen(minutes: number | null): string | null {
  if (minutes === null || !Number.isFinite(minutes)) return null;
  const arrondi = Math.round(minutes);
  if (arrondi === 0) return "aucun écart";
  const signe = arrondi > 0 ? "+" : "-";
  const absolu = Math.abs(arrondi);
  const heures = Math.floor(absolu / 60);
  const reste = absolu % 60;
  const corps =
    heures === 0
      ? `${reste} min`
      : reste === 0
        ? `${heures} h`
        : `${heures} h ${String(reste).padStart(2, "0")}`;
  return `${signe}${corps}`;
}

/** Période analysable : dates ISO valides, ordre croissant, un an au plus. */
export function plageValide(du: string, au: string): boolean {
  if (!dateIsoValide(du) || !dateIsoValide(au)) return false;
  const debut = Date.parse(`${du}T00:00:00.000Z`);
  const fin = Date.parse(`${au}T00:00:00.000Z`);
  if (fin < debut) return false;
  return (fin - debut) / 86_400_000 + 1 <= PERIODE_MAX_JOURS;
}

export interface PlagePeriode {
  du: string;
  au: string;
}

/**
 * Période retenue pour le calcul : les paramètres s'ils sont valides, les
 * défauts sinon, avec `erreur` pour prévenir la personne que sa saisie a été
 * ignorée (bornes cohérentes plutôt que page d'erreur).
 */
export function analyserPlage(
  du: string | null,
  au: string | null,
  defauts: PlagePeriode,
): { plage: PlagePeriode; erreur: boolean } {
  if (du === null && au === null) return { plage: defauts, erreur: false };
  const candidat = { du: du ?? defauts.du, au: au ?? defauts.au };
  return plageValide(candidat.du, candidat.au)
    ? { plage: candidat, erreur: false }
    : { plage: defauts, erreur: true };
}
