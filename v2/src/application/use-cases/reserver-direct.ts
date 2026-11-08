import { construireEcheancier, type Echeancier } from "@/domain/echeancier";
import { ErreurMetier } from "@/domain/erreurs";
import { montantTaxeSejour } from "@/domain/fiscal";
import {
  calculerRemise,
  normaliserCodePromo,
  promotionApplicable,
} from "@/domain/promotion";
import type { EcheancePaiement } from "../ports/echeances-paiement-repository";
import type { EcheancesPaiementRepository } from "../ports/echeances-paiement-repository";
import type { ParametresFiscauxRepository } from "../ports/parametres-fiscaux-repository";
import type { PromotionsRepository } from "../ports/promotions-repository";
import {
  DemanderReservationDirecte,
  type DemanderReservationInput,
  type DemandeReservation,
} from "./reservation-directe";
import { ObtenirParametresFiscaux } from "./parametres-fiscaux";

export interface ReserverDirectInput extends DemanderReservationInput {
  acomptePourcent?: number;
  joursSoldeAvantArrivee?: number;
  cautionCentimes?: number | null;
  codePromo?: string | null;
  maintenant?: Date;
}

export interface ReservationDirecteComplete extends DemandeReservation {
  taxeCentimes: number;
  remiseCentimes: number;
  totalCentimes: number;
  echeancier: Echeancier;
  echeances: EcheancePaiement[];
}

/**
 * Réserve en direct : nuitées + taxe de séjour − remise, puis échéancier
 * acompte/solde/caution. La réservation et ses échéances sont créées dans
 * l'ordre ; un échec d'échéance laisse une réservation à corriger, jamais un
 * double débit.
 */
export class ReserverDirect {
  constructor(
    private readonly demander: DemanderReservationDirecte,
    private readonly fiscal: ParametresFiscauxRepository,
    private readonly promotions: PromotionsRepository,
    private readonly echeances: EcheancesPaiementRepository,
  ) {}

  async executer(input: ReserverDirectInput): Promise<ReservationDirecteComplete> {
    const devis = await this.demander.preparer(input);
    const parametres = await new ObtenirParametresFiscaux(this.fiscal).executer(
      input.tenantId,
    );
    const taxeCentimes = montantTaxeSejour({
      nuits: devis.nuits,
      voyageurs: input.voyageurs,
      taxeSejourNuitPersonneCentimes:
        parametres.taxeSejourNuitPersonneCentimes,
      taxeSejourPlafondCentimes: parametres.taxeSejourPlafondCentimes,
    });
    const baseCentimes = devis.totalCentimes + taxeCentimes;

    let remiseCentimes = 0;
    const code = input.codePromo?.trim();
    if (code) {
      const promotion = await this.promotions.trouverParCode(
        input.tenantId,
        normaliserCodePromo(code),
      );
      if (!promotion) {
        throw new ErreurMetier(
          "PROMOTION_INVALIDE",
          "Ce code promotionnel n'existe pas.",
        );
      }
      if (
        !promotionApplicable(promotion, {
          nuits: devis.nuits,
          montantCentimes: baseCentimes,
          logementId: input.logementId,
          date: input.debut,
        })
      ) {
        throw new ErreurMetier(
          "PROMOTION_INVALIDE",
          "Ce code promotionnel n'est pas applicable à ce séjour.",
        );
      }
      remiseCentimes = calculerRemise(promotion, baseCentimes);
    }

    const totalCentimes = baseCentimes - remiseCentimes;
    if (!Number.isInteger(totalCentimes) || totalCentimes <= 0) {
      throw new ErreurMetier(
        "PAIEMENT_INVALIDE",
        "Le total de la réservation est invalide.",
      );
    }

    const { reservation } = await this.demander.executer({
      ...input,
      totalCentimes,
    });

    const echeancier = construireEcheancier({
      totalSejourCentimes: totalCentimes,
      arrivee: new Date(`${input.debut}T00:00:00Z`),
      maintenant: input.maintenant,
      acomptePourcent: input.acomptePourcent ?? 30,
      joursSoldeAvantArrivee: input.joursSoldeAvantArrivee ?? 30,
      cautionCentimes: input.cautionCentimes,
    });

    const echeances = await this.echeances.creerPlusieurs(
      [
        echeancier.acompte,
        echeancier.solde,
        ...(echeancier.caution ? [echeancier.caution] : []),
      ].map((echeance) => ({
        tenantId: input.tenantId,
        reservationId: reservation.id,
        type: echeance.type,
        montantCentimes: echeance.montantCentimes,
        exigibleLe: echeance.exigibleLe.toISOString().slice(0, 10),
        statut: echeance.statut,
      })),
    );

    return {
      reservation,
      devis,
      taxeCentimes,
      remiseCentimes,
      totalCentimes,
      echeancier,
      echeances,
    };
  }
}
