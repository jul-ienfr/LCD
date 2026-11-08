import {
  remboursementAnnulation,
  type PolitiqueAnnulation,
} from "@/domain/echeancier";
import { ErreurMetier } from "@/domain/erreurs";
import type { Reservation } from "@/domain/reservation";
import type { CautionRepository } from "../ports/caution-repository";
import type { EcheancesPaiementRepository } from "../ports/echeances-paiement-repository";
import type { Paiement } from "../ports/paiement";
import type { PaiementRepository } from "../ports/paiement-repository";
import type { ReservationRepository } from "../ports/reservation-repository";

export interface AnnulerReservationInput {
  tenantId: string;
  reservationId: string;
  politique: PolitiqueAnnulation;
  dateAnnulation?: string;
  motif?: string;
}

export interface ResultatAnnulation {
  reservation: Reservation;
  dejaAnnulee: boolean;
  montantPayeCentimes: number;
  montantRembourseCentimes: number;
  echeancesAnnulees: number;
  cautionsLiberees: number;
}

const JOUR = 86_400_000;

/** Nombre de jours entiers entre deux dates AAAA-MM-JJ. */
export function joursEntre(depuis: string, jusqua: string): number {
  return Math.round(
    (new Date(`${jusqua}T00:00:00Z`).getTime() -
      new Date(`${depuis}T00:00:00Z`).getTime()) /
      JOUR,
  );
}

/**
 * Annule une réservation : calcule le remboursement selon la politique,
 * rembourse les paiements encaissés, annule les échéances restantes et
 * libère les cautions actives. Idempotent sur une réservation déjà annulée.
 */
export class AnnulerReservation {
  constructor(
    private readonly reservations: ReservationRepository,
    private readonly echeances: EcheancesPaiementRepository,
    private readonly paiements: PaiementRepository,
    private readonly paiement?: Paiement,
    private readonly cautions?: CautionRepository,
  ) {}

  async executer(input: AnnulerReservationInput): Promise<ResultatAnnulation> {
    const reservation = await this.reservations.trouverParId(
      input.tenantId,
      input.reservationId,
    );
    if (!reservation) {
      throw new ErreurMetier(
        "RESERVATION_INTROUVABLE",
        "Cette réservation n'existe pas.",
      );
    }

    const paiements = await this.paiements.listerParReservation(
      input.tenantId,
      reservation.id,
    );
    const montantPaye = paiements.reduce(
      (total, paiement) => total + paiement.montantCentimes,
      0,
    );

    if (reservation.statut === "annulee") {
      return {
        reservation,
        dejaAnnulee: true,
        montantPayeCentimes: montantPaye,
        montantRembourseCentimes: 0,
        echeancesAnnulees: 0,
        cautionsLiberees: 0,
      };
    }

    const dateAnnulation = input.dateAnnulation ?? jourISO();
    const joursAvantArrivee = Math.max(
      0,
      joursEntre(dateAnnulation, reservation.debut),
    );
    const montantRembourse = remboursementAnnulation(
      montantPaye,
      joursAvantArrivee,
      input.politique,
    );

    if (montantRembourse > 0 && this.paiement?.rembourser) {
      await this.rembourser(input.tenantId, paiements, montantRembourse);
    }

    const echeancesAnnulees = await this.echeances.annulerRestantes(
      input.tenantId,
      reservation.id,
    );
    const cautionsLiberees = await this.libererCautions(
      input.tenantId,
      reservation.id,
    );
    const annulee = await this.reservations.annuler(
      input.tenantId,
      reservation.id,
    );

    return {
      reservation: annulee ?? reservation,
      dejaAnnulee: false,
      montantPayeCentimes: montantPaye,
      montantRembourseCentimes: montantRembourse,
      echeancesAnnulees,
      cautionsLiberees,
    };
  }

  private async rembourser(
    tenantId: string,
    paiements: Awaited<ReturnType<PaiementRepository["listerParReservation"]>>,
    objectifCentimes: number,
  ): Promise<void> {
    let restant = objectifCentimes;
    for (const paiement of paiements) {
      if (restant <= 0) break;
      const intent = paiement.externalId;
      // Seuls les PaymentIntent (pi_) sont remboursables par API ; un
      // identifiant de session Checkout (cs_) doit être converti en amont.
      if (!intent || !intent.startsWith("pi_") || paiement.mode !== "cb") {
        continue;
      }
      const montant = Math.min(restant, paiement.montantCentimes);
      await this.paiement!.rembourser!(intent, montant);
      restant -= montant;
    }
    // Les paiements hors carte (virement, espèces) restent à traiter à la main.
  }

  private async libererCautions(
    tenantId: string,
    reservationId: string,
  ): Promise<number> {
    if (!this.cautions) return 0;
    const caution = await this.cautions.trouverParReservation(
      tenantId,
      reservationId,
    );
    if (!caution || caution.statut !== "recue") return 0;
    await this.cautions.changerStatut(tenantId, caution.id, {
      statut: "restituee",
      dateRestitution: jourISO(),
      montantRetenuCentimes: 0,
    });
    return 1;
  }
}

function jourISO(): string {
  return new Date().toISOString().slice(0, 10);
}
