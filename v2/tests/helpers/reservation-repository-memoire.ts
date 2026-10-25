import type {
  CreerReservationData,
  ReservationRepository,
} from "@/application/ports/reservation-repository";
import type { Reservation } from "@/domain/reservation";
import { sejoursSeChevauchent } from "@/domain/planning";

export class ReservationRepositoryMemoire implements ReservationRepository {
  private readonly rows: Reservation[] = [];

  async creer(data: CreerReservationData): Promise<Reservation> {
    const maintenant = new Date();
    const reservation: Reservation = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      logementId: data.logementId,
      ref: data.ref,
      clientNom: data.clientNom ?? null,
      clientEmail: data.clientEmail ?? null,
      voyageurs: data.voyageurs,
      debut: data.debut,
      fin: data.fin,
      statut: data.statut ?? "brouillon",
      montantCentimes: data.montantCentimes,
      source: data.source ?? "direct",
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.rows.push(reservation);
    return reservation;
  }

  async listerParMois(
    tenantId: string,
    debut: string,
    fin: string,
  ): Promise<Reservation[]> {
    return this.rows.filter(
      (r) => r.tenantId === tenantId && r.debut < fin && r.fin > debut,
    );
  }

  async chevauche(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
  ): Promise<boolean> {
    return this.rows.some(
      (r) =>
        r.tenantId === tenantId &&
        r.logementId === logementId &&
        sejoursSeChevauchent(r.debut, r.fin, debut, fin),
    );
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<Reservation | null> {
    return (
      this.rows.find((r) => r.tenantId === tenantId && r.id === id) ?? null
    );
  }

  async listerTous(tenantId: string): Promise<Reservation[]> {
    return this.rows.filter((r) => r.tenantId === tenantId);
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<Reservation | null> {
    return (
      this.rows.find((r) => r.tenantId === tenantId && r.ref === ref) ?? null
    );
  }
}
