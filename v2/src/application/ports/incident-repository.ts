import type { Incident } from "@/domain/incident";

export interface CreerIncidentData {
  tenantId: string;
  logementId: string;
  reservationId: string | null;
  ref: string;
  message: string;
}

export interface ResultatIncident {
  incident: Incident;
  cree: boolean;
}

export interface IncidentRepository {
  creer(data: CreerIncidentData): Promise<ResultatIncident>;
  listerParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<Incident[]>;
}
