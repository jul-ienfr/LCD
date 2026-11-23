import type {
  MiseAJourReservationFournisseurData,
  ReservationFournisseurRepository,
} from "@/application/ports/reservation-fournisseur-repository";
import type {
  CreerReservationData,
  FiltreReservations,
  OptionsListeReservations,
  ReservationRepository,
} from "@/application/ports/reservation-repository";
import type { Reservation } from "@/domain/reservation";
import { sejoursSeChevauchent } from "@/domain/planning";

/** Équivalent mémoire de `conditionsFiltre` (FR-026), sans jointure logement. */
function correspondAuFiltre(
  reservation: Reservation,
  tenantId: string,
  filtre: FiltreReservations | undefined,
): boolean {
  if (reservation.tenantId !== tenantId) return false;
  if (!filtre) return true;
  if (filtre.logementId && reservation.logementId !== filtre.logementId) {
    return false;
  }
  if (
    filtre.periode &&
    !(reservation.debut < filtre.periode.fin && reservation.fin > filtre.periode.debut)
  ) {
    return false;
  }
  if (filtre.finMin && reservation.fin < filtre.finMin) return false;
  if (filtre.debutMax && reservation.debut > filtre.debutMax) return false;
  if (filtre.statut && reservation.statut !== filtre.statut) return false;
  const terme = filtre.recherche?.trim().toLowerCase();
  if (terme) {
    const champs = [
      reservation.ref,
      reservation.clientNom,
      reservation.clientEmail,
    ];
    if (!champs.some((champ) => champ?.toLowerCase().includes(terme))) {
      return false;
    }
  }
  return true;
}

function trierReservations(
  rows: Reservation[],
  ordre: OptionsListeReservations["ordre"],
): Reservation[] {
  const copie = [...rows];
  if (ordre === "debut-desc") {
    return copie.sort((a, b) => b.debut.localeCompare(a.debut));
  }
  if (ordre === "fin-asc") {
    return copie.sort((a, b) => a.fin.localeCompare(b.fin));
  }
  return copie.sort((a, b) => a.debut.localeCompare(b.debut));
}

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

  async listerPage(
    tenantId: string,
    options: OptionsListeReservations,
  ): Promise<Reservation[]> {
    const limite = Math.max(1, Math.min(200, Math.trunc(options.limite)));
    const decalage = Math.max(0, Math.trunc(options.decalage));
    const correspondantes = this.rows.filter((r) =>
      correspondAuFiltre(r, tenantId, options),
    );
    return trierReservations(correspondantes, options.ordre).slice(
      decalage,
      decalage + limite,
    );
  }

  async compter(
    tenantId: string,
    filtre: FiltreReservations = {},
  ): Promise<number> {
    return this.rows.filter((r) => correspondAuFiltre(r, tenantId, filtre))
      .length;
  }

  async rechercher(
    tenantId: string,
    terme: string,
    limite: number,
  ): Promise<Reservation[]> {
    const borne = Math.max(1, Math.min(50, Math.trunc(limite)));
    return trierReservations(
      this.rows.filter((r) =>
        correspondAuFiltre(r, tenantId, { recherche: terme }),
      ),
      "debut-asc",
    ).slice(0, borne);
  }

  async listerParIds(
    tenantId: string,
    ids: readonly string[],
  ): Promise<Reservation[]> {
    const cherches = new Set(ids);
    return this.rows.filter(
      (r) => r.tenantId === tenantId && cherches.has(r.id),
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
