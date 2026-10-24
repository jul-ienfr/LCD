import { dateIsoValide } from "./calendrier";

export type MissionId = string;
export type TypeMission = "menage" | "maintenance" | "accueil" | "autre";
export type StatutMission =
  | "planifiee"
  | "en_cours"
  | "terminee"
  | "annulee";

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
