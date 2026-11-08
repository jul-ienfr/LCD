import { ErreurMetier } from "@/domain/erreurs";
import type { ModePaiement } from "@/domain/paiement";
import type { Paiement } from "@/domain/paiement";
import type {
  EcheancePaiement,
  EcheancesPaiementRepository,
} from "../ports/echeances-paiement-repository";
import type { PaiementRepository } from "../ports/paiement-repository";

export interface PayerEcheanceInput {
  tenantId: string;
  echeanceId: string;
  ref: string;
  montantCentimes?: number;
  mode?: ModePaiement;
  datePaiement?: string;
  reference?: string | null;
  externalId?: string | null;
  notes?: string | null;
}

export interface ResultatPayerEcheance {
  echeance: EcheancePaiement;
  paiement: Paiement | null;
  dejaPaye: boolean;
}

/**
 * Encaisse une échéance unique. La référence de paiement est stable, donc un
 * rejeu du webhook ou du formulaire ne crée pas de second paiement.
 */
export class PayerEcheance {
  constructor(
    private readonly echeances: EcheancesPaiementRepository,
    private readonly paiements: PaiementRepository,
  ) {}

  async executer(input: PayerEcheanceInput): Promise<ResultatPayerEcheance> {
    const echeance = await this.echeances.trouverParId(
      input.tenantId,
      input.echeanceId,
    );
    if (!echeance) {
      throw new ErreurMetier(
        "PAIEMENT_INVALIDE",
        "Cette échéance n'existe pas.",
      );
    }
    if (echeance.statut === "paye") {
      return { echeance, paiement: null, dejaPaye: true };
    }
    if (echeance.statut !== "a_payer") {
      throw new ErreurMetier(
        "PAIEMENT_INVALIDE",
        "Cette échéance ne peut plus être payée.",
      );
    }

    const montant = input.montantCentimes ?? echeance.montantCentimes;
    if (
      !Number.isInteger(montant) ||
      montant <= 0 ||
      montant !== echeance.montantCentimes
    ) {
      throw new ErreurMetier(
        "PAIEMENT_INVALIDE",
        "Le montant ne correspond pas à l'échéance.",
      );
    }
    const ref = input.ref.trim();
    if (ref.length < 4 || ref.length > 64) {
      throw new ErreurMetier(
        "PAIEMENT_INVALIDE",
        "La référence de paiement est invalide.",
      );
    }

    const resultat = await this.paiements.creer({
      tenantId: input.tenantId,
      factureId: null,
      reservationId: echeance.reservationId,
      echeanceId: echeance.id,
      externalId: input.externalId ?? null,
      ref,
      montantCentimes: montant,
      mode: input.mode ?? "cb",
      datePaiement: input.datePaiement ?? new Date().toISOString().slice(0, 10),
      reference: input.reference ?? null,
      notes: input.notes ?? null,
    });

    await this.echeances.marquerPaye(
      input.tenantId,
      echeance.id,
      resultat.paiement.id,
    );

    return {
      echeance: { ...echeance, statut: "paye", paiementId: resultat.paiement.id },
      paiement: resultat.paiement,
      dejaPaye: false,
    };
  }
}
