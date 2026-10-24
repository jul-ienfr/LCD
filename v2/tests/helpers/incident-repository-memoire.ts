import type {
  CreerIncidentData,
  IncidentRepository,
  ResultatIncident,
} from "@/application/ports/incident-repository";
import type { Incident } from "@/domain/incident";

export class IncidentRepositoryMemoire implements IncidentRepository {
  private readonly rows: Incident[] = [];

  async creer(data: CreerIncidentData): Promise<ResultatIncident> {
    const existant = this.rows.find(
      (i) => i.tenantId === data.tenantId && i.ref === data.ref,
    );
    if (existant) return { incident: existant, cree: false };

    const incident: Incident = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      logementId: data.logementId,
      reservationId: data.reservationId,
      ref: data.ref,
      message: data.message,
      statut: "ouvert",
      createdAt: new Date(),
    };
    this.rows.push(incident);
    return { incident, cree: true };
  }

  async listerParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<Incident[]> {
    return this.rows.filter(
      (i) => i.tenantId === tenantId && i.reservationId === reservationId,
    );
  }
}
