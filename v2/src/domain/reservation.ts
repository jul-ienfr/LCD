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
  createdAt: Date;
  updatedAt: Date;
}
