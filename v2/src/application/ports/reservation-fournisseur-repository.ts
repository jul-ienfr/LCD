import type { Reservation } from "@/domain/reservation";
import type { CreerReservationData } from "./reservation-repository";

export interface MiseAJourReservationFournisseurData {
  debut: string;
  fin: string;
  clientNom: string | null;
  clientEmail: string | null;
  montantCentimes: number;
  statut: Reservation["statut"];
}

export interface ReservationFournisseurRepository {
  trouverParRef(tenantId: string, ref: string): Promise<Reservation | null>;
  trouverParReference(
    tenantId: string,
    logementId: string,
    reference: string,
  ): Promise<Reservation | null>;
  listerChevauchements(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
  ): Promise<Reservation[]>;
  creer(data: CreerReservationData): Promise<Reservation>;
  mettreAJour(
    tenantId: string,
    id: string,
    data: MiseAJourReservationFournisseurData,
  ): Promise<Reservation>;
}
