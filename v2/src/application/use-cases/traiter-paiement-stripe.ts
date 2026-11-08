import { ErreurMetier } from "@/domain/erreurs";
import type { EvenementPaiement } from "../ports/paiement";
import type { EcheancesPaiementRepository } from "../ports/echeances-paiement-repository";
import type { FactureRepository } from "../ports/facture-repository";
import type { PaiementRepository } from "../ports/paiement-repository";
import { EnregistrerPaiement } from "./enregistrer-paiement";

export class TraiterPaiementStripe {
  constructor(
    private readonly paiements: PaiementRepository,
    private readonly factures: FactureRepository,
    private readonly echeances?: EcheancesPaiementRepository,
  ) {}

  async executer(evenement: EvenementPaiement) {
    if (evenement.type !== "paiement_reussi") {
      return { ignore: true as const };
    }

    const tenantId = evenement.metadata.tenant_id;
    const echeanceId = evenement.metadata.echeance_id;
    const factureId = evenement.metadata.facture_id;
    if (!tenantId) {
      throw new ErreurMetier(
        "PAIEMENT_INVALIDE",
        "Webhook Stripe sans tenant_id.",
      );
    }
    if (!echeanceId && !factureId) {
      throw new ErreurMetier(
        "PAIEMENT_INVALIDE",
        "Webhook Stripe sans facture_id ni echeance_id.",
      );
    }
    if (evenement.devise !== "EUR") {
      throw new ErreurMetier(
        "PAIEMENT_INVALIDE",
        "Devise Stripe non supportée.",
      );
    }

    const ref = `stripe-${evenement.sessionId.replace(/[^A-Za-z0-9-]/g, "-")}`.slice(
      0,
      64,
    );

    // Paiement d'une échéance de réservation : pas de facture, idempotent par ref.
    if (echeanceId) {
      if (!this.echeances) {
        throw new ErreurMetier(
          "PAIEMENT_INVALIDE",
          "Échéancier indisponible pour ce webhook.",
        );
      }
      const echeance = await this.echeances.trouverParId(tenantId, echeanceId);
      if (!echeance) {
        throw new ErreurMetier(
          "PAIEMENT_INVALIDE",
          "Échéance Stripe inconnue.",
        );
      }

      const resultat = await this.paiements.creer({
        tenantId,
        factureId: null,
        reservationId: echeance.reservationId,
        echeanceId: echeance.id,
        externalId: evenement.sessionId,
        ref,
        montantCentimes: evenement.montantCentimes,
        mode: "cb",
        datePaiement: new Date().toISOString().slice(0, 10),
        reference: evenement.sessionId,
        notes: "Stripe Checkout échéance",
      });

      if (echeance.statut !== "paye") {
        await this.echeances.marquerPaye(
          tenantId,
          echeance.id,
          resultat.paiement.id,
        );
      }

      return {
        ignore: false as const,
        cree: resultat.cree,
        paiement: resultat.paiement,
        facture: null,
        resteCentimes: 0,
      };
    }

    const resultat = await new EnregistrerPaiement(
      this.paiements,
      this.factures,
    ).executer({
      tenantId,
      factureId: factureId as string,
      ref,
      montantCentimes: evenement.montantCentimes,
      mode: "cb",
      datePaiement: new Date().toISOString().slice(0, 10),
      reference: evenement.sessionId,
      notes: "Stripe Checkout",
    });

    return { ignore: false as const, ...resultat };
  }
}
