import { ajouterJours } from "@/domain/calendrier";
import { ErreurMetier } from "@/domain/erreurs";
import { devisDirect, type DevisDirect } from "@/domain/reservation-directe";
import { motifSejourRefuse } from "@/domain/restriction-sejour";
import { jourParis } from "@/lib/date-paris";
import type { Reservation } from "@/domain/reservation";
import type { BlocageRepository } from "../ports/blocage-repository";
import type { LogementRepository } from "../ports/logement-repository";
import type { ReservationRepository } from "../ports/reservation-repository";
import type { RestrictionSejourRepository } from "../ports/restriction-sejour-repository";
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
  aujourdhui?: string;
  /** Total imposé par l'appelant (taxe, remise) ; sinon total des nuitées. */
  totalCentimes?: number;
  /** Attribution : `direct`, `widget`, `utm:...`, `promo:...`. */
  source?: string;
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
    private readonly restrictions: RestrictionSejourRepository,
  ) {}

  /**
   * Valide le séjour et calcule le devis des nuitées sans créer la réservation.
   * Permet à `ReserverDirect` d'ajouter taxe et remise avant l'écriture.
   */
  async preparer(input: DemanderReservationInput): Promise<DevisDirect> {
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

    const cutoffJours = logement.cutoffJours ?? 0;
    if (cutoffJours > 0) {
      const limite = ajouterJours(
        input.aujourdhui ?? jourParis(),
        cutoffJours,
      );
      if (input.debut < limite) {
        throw new ErreurMetier(
          "CUTOFF",
          `Les arrivées à moins de ${cutoffJours} jour${
            cutoffJours > 1 ? "s" : ""
          } ne sont pas autorisées.`,
        );
      }
    }

    const regles = await this.restrictions.listerParPeriode(
      input.tenantId,
      input.logementId,
      input.debut,
      input.fin,
    );
    const motif = motifSejourRefuse(regles, input.debut, input.fin);
    if (motif) {
      throw new ErreurMetier("SEJOUR_NON_AUTORISE", motif);
    }

    const bufferJours = logement.bufferJours ?? 0;
    if (bufferJours > 0) {
      const debutAvecBuffer = ajouterJours(input.debut, -bufferJours);
      const finAvecBuffer = ajouterJours(input.fin, bufferJours);
      const proche =
        (await this.reservations.chevauche(
          input.tenantId,
          input.logementId,
          debutAvecBuffer,
          input.fin,
        )) ||
        (await this.reservations.chevauche(
          input.tenantId,
          input.logementId,
          input.debut,
          finAvecBuffer,
        )) ||
        (await this.blocages.chevauche(
          input.tenantId,
          input.logementId,
          debutAvecBuffer,
          input.fin,
        )) ||
        (await this.blocages.chevauche(
          input.tenantId,
          input.logementId,
          input.debut,
          finAvecBuffer,
        ));
      if (proche) {
        throw new ErreurMetier(
          "RESERVATION_CHEVAUCHE",
          `Un délai de préparation de ${bufferJours} jour${
            bufferJours > 1 ? "s" : ""
          } est requis entre deux séjours.`,
        );
      }
    }

    const tousLesTarifs = await this.tarifs.listerParMois(
      input.tenantId,
      input.logementId,
      input.debut,
      input.fin,
    );
    return devisDirect(
      input.debut,
      input.fin,
      tousLesTarifs
        .filter((tarif) => tarif.date < input.fin)
        .map((tarif) => ({
          date: tarif.date,
          prixCentimes: tarif.prixCentimes,
          prixParPersonneCentimes: tarif.prixParPersonneCentimes ?? undefined,
          personnesIncluses: tarif.personnesIncluses,
        })),
      { voyageurs: input.voyageurs },
    );
  }

  async executer(input: DemanderReservationInput): Promise<DemandeReservation> {
    const nom = input.clientNom.trim();
    const email = input.clientEmail.trim().toLowerCase();
    const devis = await this.preparer(input);
    const total = input.totalCentimes ?? devis.totalCentimes;
    if (!Number.isInteger(total) || total <= 0) {
      throw new ErreurMetier(
        "PAIEMENT_INVALIDE",
        "Le total de la réservation est invalide.",
      );
    }

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
      montantCentimes: total,
      source: input.source,
    });

    return { reservation, devis };
  }
}
