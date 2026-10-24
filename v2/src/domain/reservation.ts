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
  debut: string; // AAAA-MM-JJ
  fin: string; // AAAA-MM-JJ, exclusive
  statut: StatutReservation;
  montantCentimes: number;
  createdAt: Date;
  updatedAt: Date;
}
