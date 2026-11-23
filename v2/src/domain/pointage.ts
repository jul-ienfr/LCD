/**
 * Pointage des missions (spec 006, FR-031).
 *
 * Le serveur est l'horloge de référence : sans horodatage client, il pose
 * `maintenant`. Un pointage fait hors ligne peut fournir son horodatage local
 * (borné et marqué `hors_ligne`) ; le serveur conserve en plus l'instant de
 * réception, preuve que le pointage est arrivé après coup.
 *
 * Pur : aucune dépendance base, réseau ou horloge système.
 */

import type { SourcePointage, TypeMission } from "./mission";

export type { SourcePointage };

/** Durée prévue par défaut selon le type, en minutes (surchargeable par mission). */
export const DUREES_PREVUES_MINUTES: Record<TypeMission, number> = {
  menage: 120,
  maintenance: 60,
  accueil: 30,
  autre: 60,
};

/** Un horodatage client ne peut pas dépasser l'horloge serveur de plus de 5 min. */
export const TOLERANCE_AVANCE_MS = 5 * 60 * 1000;
/** Ni précéder la réception de plus de 7 jours. */
export const TOLERANCE_RETARD_MS = 7 * 24 * 60 * 60 * 1000;

export interface Pointage {
  debutReel: Date | null;
  finReelle: Date | null;
  debutReelSource: SourcePointage | null;
  finReelleSource: SourcePointage | null;
  debutReelRecuLe: Date | null;
  finReelleRecuLe: Date | null;
}

export function dureePrevueMinutes(
  type: TypeMission,
  surcharge: number | null | undefined,
): number {
  return surcharge ?? DUREES_PREVUES_MINUTES[type];
}

/**
 * Horodatage local fourni par un client après coupure : ISO valide, pas dans
 * un futur invraisemblable, pas plus vieux que la tolérance. `null` est
 * accepté — le serveur horodate alors lui-même.
 */
export function horodatageLocalValide(
  valeur: string | null | undefined,
  maintenant: Date,
): boolean {
  if (valeur === null || valeur === undefined || valeur.trim() === "") return true;
  const date = Date.parse(valeur);
  if (!Number.isFinite(date)) return false;
  if (date > maintenant.getTime() + TOLERANCE_AVANCE_MS) return false;
  return date >= maintenant.getTime() - TOLERANCE_RETARD_MS;
}

/** Durée réelle en minutes entières, jamais négative. */
export function dureeReelleMinutes(debut: Date, fin: Date): number {
  return Math.max(0, Math.round((fin.getTime() - debut.getTime()) / 60_000));
}

/** Écart signé entre durée réelle et durée prévue (négatif = plus rapide). */
export function ecartDureeMinutes(reelle: number, prevue: number): number {
  return reelle - prevue;
}

export type EtatPointage = "non_commence" | "en_cours" | "termine";

export function etatPointage(pointage: Pick<Pointage, "debutReel" | "finReelle">): EtatPointage {
  if (pointage.finReelle) return "termine";
  if (pointage.debutReel) return "en_cours";
  return "non_commence";
}

/** « 1 h 35 », « 42 min ». */
export function formaterDuree(minutes: number): string {
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  if (heures === 0) return `${reste} min`;
  if (reste === 0) return `${heures} h`;
  return `${heures} h ${String(reste).padStart(2, "0")}`;
}

/** « +12 min » / « -8 min » / « à l'heure ». */
export function formaterEcart(minutes: number): string {
  if (minutes === 0) return "à l’heure";
  return `${minutes > 0 ? "+" : "-"}${formaterDuree(Math.abs(minutes))}`;
}
