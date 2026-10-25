import type { Reservation } from "@/domain/reservation";

export interface CreerReservationData {
  tenantId: string;
  logementId: string;
  ref: string;
  clientNom?: string;
  voyageurs: number;
  debut: string;
  fin: string;
  montantCentimes: number;
  source?: string;
  statut?: Reservation["statut"];
}

export interface ReservationRepository {
  creer(data: CreerReservationData): Promise<Reservation>;
  listerParMois(
    tenantId: string,
    debut: string,
    fin: string,
  ): Promise<Reservation[]>;
  chevauche(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
  ): Promise<boolean>;
  trouverParId(
    tenantId: string,
    id: string,
  ): Promise<Reservation | null>;
  trouverParRef(tenantId: string, ref: string): Promise<Reservation | null>;
  listerTous(tenantId: string): Promise<Reservation[]>;
}
