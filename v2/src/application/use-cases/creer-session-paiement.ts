import { ErreurMetier } from "@/domain/erreurs";
import { resteAPayer } from "@/domain/paiement";
import type { FactureRepository } from "../ports/facture-repository";
import type { PaiementRepository } from "../ports/paiement-repository";
import type { Paiement } from "../ports/paiement";

export interface CreerSessionPaiementInput {
  tenantId: string;
  factureId: string;
  montantCentimes?: number;
  successUrl: string;
  cancelUrl: string;
}

export class CreerSessionPaiement {
  constructor(
    private readonly factures: FactureRepository,
    private readonly paiements: PaiementRepository,
    private readonly paiement: Paiement,
  ) {}

  async executer(input: CreerSessionPaiementInput) {
    const facture = await this.factures.trouver(
      input.tenantId,
      input.factureId,
    );
    if (!facture) {
      throw new ErreurMetier("PAIEMENT_INVALIDE", "Facture introuvable.");
    }
    if (facture.statut !== "emise") {
      throw new ErreurMetier(
        "PAIEMENT_INVALIDE",
        "Seule une facture émise peut être payée en ligne.",
      );
    }

    const paiements = await this.paiements.listerParFacture(
      input.tenantId,
      facture.id,
    );
    const reste = resteAPayer(facture.montantTtcCentimes, paiements);
    if (reste <= 0) {
      throw new ErreurMetier("PAIEMENT_INVALIDE", "Cette facture est soldée.");
    }

    const montant = input.montantCentimes ?? reste;
    if (!Number.isInteger(montant) || montant <= 0 || montant > reste) {
      throw new ErreurMetier(
        "PAIEMENT_INVALIDE",
        "Le montant doit être compris entre 1 centime et le reste à payer.",
      );
    }

    const session = await this.paiement.creerSession({
      ref: facture.numero,
      montantCentimes: montant,
      devise: "EUR",
      description: `Facture ${facture.numero}`,
      emailClient: facture.clientEmail ?? undefined,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      metadata: {
        tenant_id: input.tenantId,
        facture_id: facture.id,
      },
    });

    return { session, montantCentimes: montant };
  }
}
