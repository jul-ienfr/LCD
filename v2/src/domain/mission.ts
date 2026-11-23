import { dateIsoValide } from "./calendrier";
import type { StatutPreuve } from "./preuve-intervention";

export type MissionId = string;
export type TypeMission = "menage" | "maintenance" | "accueil" | "autre";
export type StatutMission =
  | "planifiee"
  | "en_cours"
  | "terminee"
  | "annulee";
/** Origine de l'horodatage d'un pointage (FR-031). */
export type SourcePointage = "serveur" | "hors_ligne";

export interface Mission {
  id: MissionId;
  tenantId: string;
  logementId: string;
  reservationId: string | null;
  assignedUserId: string;
  ref: string;
  type: TypeMission;
  date: string; // AAAA-MM-JJ
  heure: string | null; // HH:MM
  statut: StatutMission;
  notes: string | null;
  /** Durée prévue en minutes ; `null` = défaut du type (domain/pointage). */
  dureePrevueMinutes: number | null;
  /** Pointage serveur (FR-031) : horodatage retenu et sa source. */
  debutReel: Date | null;
  finReelle: Date | null;
  debutReelSource: SourcePointage | null;
  finReelleSource: SourcePointage | null;
  /** Instant où le serveur a reçu le pointage (diffère si hors ligne). */
  debutReelRecuLe: Date | null;
  finReelleRecuLe: Date | null;
  /** Cycle de preuve de l'intervention (FR-032/FR-033). */
  preuveStatut: StatutPreuve;
  preuveMotifRefus: string | null;
  preuveSoumiseLe: Date | null;
  preuveValideeLe: Date | null;
  preuveValideePar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const TRANSITIONS_MISSION: Record<StatutMission, StatutMission[]> = {
  planifiee: ["en_cours", "annulee"],
  en_cours: ["terminee", "annulee"],
  terminee: [],
  annulee: [],
};

export const TYPES_MISSION: TypeMission[] = [
  "menage",
  "maintenance",
  "accueil",
  "autre",
];

export function refMissionValide(ref: string): boolean {
  return /^[A-Za-z0-9-]{4,64}$/.test(ref);
}

export function heureValide(heure: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(heure);
}

export function missionValide(input: {
  ref: string;
  date: string;
  heure?: string | null;
  type: string;
}): boolean {
  return (
    refMissionValide(input.ref) &&
    dateIsoValide(input.date) &&
    (!input.heure || heureValide(input.heure)) &&
    TYPES_MISSION.includes(input.type as TypeMission)
  );
}
