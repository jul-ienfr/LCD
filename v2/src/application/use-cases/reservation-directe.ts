import { ErreurMetier } from "@/domain/erreurs";
import {
  devisDirect,
  type DevisDirect,
} from "@/domain/reservation-directe";
import type { Reservation } from "@/domain/reservation";
import type { BlocageRepository } from "../ports/blocage-repository";
import type { LogementRepository } from "../ports/logement-repository";
import type { ReservationRepository } from "../ports/reservation-repository";
import type { TarifRepository } from "../ports/tarif-repository";
import { CreerReservation } from "./creer-reservation";

export interface DemanderReservationInput {
  tenantId: string;
  logementId: string;
  ref: string;
  clientNom: string;
  clientEmail: string;
  voyageurs: number;
  debut: string;
  fin: string;
}

export type DemandeReservation = {
  reservation: Reservation;
  devis: DevisDirect;
};

export class DemanderReservationDirecte {
  constructor(
    private readonly tarifs: TarifRepository,
    private readonly reservations: ReservationRepository,
    private readonly blocages: BlocageRepository,
    private readonly logements: LogementRepository,
  ) {}

  async executer(input: DemanderReservationInput): Promise<DemandeReservation> {
    const nom = input.clientNom.trim();
    const email = input.clientEmail.trim().toLowerCase();

    if (nom.length < 2 || nom.length > 120) {
      throw new ErreurMetier(
        "NOM_INVALIDE",
        "Le nom doit contenir 2 à 120 caractères.",
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      throw new ErreurMetier(
        "EMAIL_INVALIDE",
        "L’adresse email est invalide.",
      );
    }
    const logement = await this.logements.trouverParId(
      input.tenantId,
      input.logementId,
    );
    if (!logement || logement.statut !== "actif") {
      throw new ErreurMetier(
        "LOGEMENT_INTROUVABLE",
        "Ce logement n’est pas disponible à la réservation.",
      );
    }

    const tousLesTarifs = await this.tarifs.listerParMois(
      input.tenantId,
      input.logementId,
      input.debut,
      input.fin,
    );
    const devis = devisDirect(
      input.debut,
      input.fin,
      tousLesTarifs
        .filter((tarif) => tarif.date < input.fin)
        .map((tarif) => ({
          date: tarif.date,
          prixCentimes: tarif.prixCentimes,
        })),
    );

    const reservation = await new CreerReservation(
      this.reservations,
      this.blocages,
    ).executer({
      tenantId: input.tenantId,
      logementId: input.logementId,
      ref: input.ref,
      clientNom: nom,
      clientEmail: email,
      voyageurs: input.voyageurs,
      debut: input.debut,
      fin: input.fin,
      montantCentimes: devis.totalCentimes,
    });

    return { reservation, devis };
  }
}
