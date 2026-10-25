import { ErreurMetier } from "@/domain/erreurs";
import type { EvenementPaiement } from "../ports/paiement";
import type { FactureRepository } from "../ports/facture-repository";
import type { PaiementRepository } from "../ports/paiement-repository";
import { EnregistrerPaiement } from "./enregistrer-paiement";

export class TraiterPaiementStripe {
  constructor(
    private readonly paiements: PaiementRepository,
    private readonly factures: FactureRepository,
  ) {}

  async executer(evenement: EvenementPaiement) {
    if (evenement.type !== "paiement_reussi") {
      return { ignore: true as const };
    }

    const tenantId = evenement.metadata.tenant_id;
    const factureId = evenement.metadata.facture_id;
    if (!tenantId || !factureId) {
      throw new ErreurMetier(
        "PAIEMENT_INVALIDE",
        "Webhook Stripe sans tenant_id/facture_id.",
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

    const resultat = await new EnregistrerPaiement(
      this.paiements,
      this.factures,
    ).executer({
      tenantId,
      factureId,
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
