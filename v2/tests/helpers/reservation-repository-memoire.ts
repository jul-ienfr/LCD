import type {
  MiseAJourReservationFournisseurData,
  ReservationFournisseurRepository,
} from "@/application/ports/reservation-fournisseur-repository";
import type {
  CreerReservationData,
  ReservationRepository,
} from "@/application/ports/reservation-repository";
import type { Reservation } from "@/domain/reservation";
import { sejoursSeChevauchent } from "@/domain/planning";

export class ReservationRepositoryMemoire
  implements ReservationRepository, ReservationFournisseurRepository
{
  readonly rows: Reservation[] = [];

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
      fluxIcsId: null,
      departConfirmeLe: null,
      departNote: null,
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

  async confirmerDepart(
    tenantId: string,
    id: string,
    note: string | null,
  ): Promise<Reservation | null> {
    const reservation = this.rows.find(
      (r) => r.tenantId === tenantId && r.id === id,
    );
    if (!reservation) return null;
    reservation.departConfirmeLe = new Date();
    reservation.departNote = note;
    reservation.updatedAt = new Date();
    return reservation;
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<Reservation | null> {
    return (
      this.rows.find((r) => r.tenantId === tenantId && r.ref === ref) ?? null
    );
  }

  async trouverParReference(
    tenantId: string,
    logementId: string,
    reference: string,
  ): Promise<Reservation | null> {
    return (
      this.rows.find(
        (r) =>
          r.tenantId === tenantId &&
          r.logementId === logementId &&
          r.ref === reference,
      ) ?? null
    );
  }

  async listerChevauchements(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
  ): Promise<Reservation[]> {
    return this.rows.filter(
      (r) =>
        r.tenantId === tenantId &&
        r.logementId === logementId &&
        r.statut !== "annulee" &&
        sejoursSeChevauchent(r.debut, r.fin, debut, fin),
    );
  }

  async mettreAJour(
    tenantId: string,
    id: string,
    data: MiseAJourReservationFournisseurData,
  ): Promise<Reservation> {
    const existante = this.rows.find(
      (r) => r.tenantId === tenantId && r.id === id,
    );
    if (!existante) throw new Error("Réservation fournisseur introuvable.");
    existante.debut = data.debut;
    existante.fin = data.fin;
    existante.clientNom = data.clientNom;
    existante.clientEmail = data.clientEmail;
    existante.montantCentimes = data.montantCentimes;
    existante.statut = data.statut;
    existante.updatedAt = new Date();
    return existante;
  }

  async annuler(tenantId: string, id: string): Promise<Reservation | null> {
    const reservation = this.rows.find(
      (r) => r.tenantId === tenantId && r.id === id,
    );
    if (!reservation) return null;
    reservation.statut = "annulee";
    reservation.updatedAt = new Date();
    return reservation;
  }
}
