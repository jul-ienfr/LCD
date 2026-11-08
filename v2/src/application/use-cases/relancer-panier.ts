import {
  paniersARelancer,
  type CandidatRelancePanier,
} from "@/domain/relance-panier";
import type { EmailSender } from "../ports/email";
import type { LogementRepository } from "../ports/logement-repository";
import type { PaiementRepository } from "../ports/paiement-repository";
import type { ReservationRepository } from "../ports/reservation-repository";
import { lienGestion, messagePanierAbandonne } from "@/lib/server/email-reservation";

export interface RelancerPanierInput {
  tenantId: string;
  baseUrl: string;
  tenantSlug: string;
  maintenant?: Date;
  delaiHeures?: number;
  delaiMaxHeures?: number;
  /** Relance à blanc : liste les candidats sans envoyer. */
  simulation?: boolean;
}

export interface ResultatRelancePanier {
  candidats: CandidatRelancePanier[];
  envoyes: number;
  dejaPayes: number;
}

/**
 * Relance les demandes de réservation non payées (panier abandonné).
 * Ne relance jamais une demande ayant déjà reçu un paiement.
 */
export class RelancerPanierAbandonne {
  constructor(
    private readonly reservations: ReservationRepository,
    private readonly paiements: PaiementRepository,
    private readonly email: EmailSender,
    private readonly logements?: LogementRepository,
  ) {}

  async executer(
    input: RelancerPanierInput,
  ): Promise<ResultatRelancePanier> {
    const maintenant = input.maintenant ?? new Date();
    const toutes = await this.reservations.listerTous(input.tenantId);
    const brouillons = toutes.filter(
      (reservation) => reservation.statut === "brouillon",
    );
    const logementIdParReservation = new Map(
      toutes.map((reservation) => [reservation.id, reservation.logementId]),
    );

    const candidats: CandidatRelancePanier[] = [];
    let dejaPayes = 0;

    for (const reservation of brouillons) {
      const paiements = await this.paiements.listerParReservation(
        input.tenantId,
        reservation.id,
      );
      if (paiements.length > 0) {
        dejaPayes += 1;
        continue;
      }
      const [candidat] = paniersARelancer(
        [
          {
            reservationId: reservation.id,
            ref: reservation.ref,
            clientNom: reservation.clientNom,
            clientEmail: reservation.clientEmail,
            debut: reservation.debut,
            fin: reservation.fin,
            montantCentimes: reservation.montantCentimes,
            createdAt: reservation.createdAt,
          },
        ],
        {
          maintenant,
          delaiHeures: input.delaiHeures,
          delaiMaxHeures: input.delaiMaxHeures,
        },
      );
      if (candidat) candidats.push(candidat);
    }

    if (input.simulation) {
      return { candidats, envoyes: 0, dejaPayes };
    }

    let envoyes = 0;
    for (const candidat of candidats) {
      const logement = this.logements
        ? await this.logements.trouverParId(
            input.tenantId,
            logementIdParReservation.get(candidat.reservationId) ?? "",
          )
        : null;
      await this.email.envoyer({
        ...messagePanierAbandonne({
          ref: candidat.ref,
          clientNom: candidat.clientNom ?? "",
          logementNom: logement?.nom ?? "votre logement",
          debut: candidat.debut,
          fin: candidat.fin,
          lienGestion: lienGestion(
            input.baseUrl,
            candidat.ref,
            input.tenantSlug,
          ),
        }),
        to: candidat.clientEmail as string,
      });
      envoyes += 1;
    }

    return { candidats, envoyes, dejaPayes };
  }
}
