import type { LogementId } from "./logement";
import type { TenantId } from "./tenant";

export type ReservationId = string;
export type StatutReservation =
  | "brouillon"
  | "confirmee"
  | "en_sejour"
  | "terminee"
  | "annulee";

export interface Reservation {
  id: ReservationId;
  tenantId: TenantId;
  logementId: LogementId;
  ref: string;
  clientNom: string | null;
  clientEmail: string | null;
  voyageurs: number;
  debut: string; // AAAA-MM-JJ
  fin: string; // AAAA-MM-JJ, exclusive
  statut: StatutReservation;
  montantCentimes: number;
  source: string;
  fluxIcsId: string | null;
  departConfirmeLe: Date | null;
  departNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Étapes minimales du check-out, dans l'ordre affiché au voyageur. */
export const ETAPES_DEPART = [
  "poubelles",
  "vaisselle",
  "fenetres",
  "cles",
] as const;

export type EtapeDepart = (typeof ETAPES_DEPART)[number];

export function checklistDepartComplete(valeurs: readonly string[]): boolean {
  return ETAPES_DEPART.every((etape) => valeurs.includes(etape));
}
