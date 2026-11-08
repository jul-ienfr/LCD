import {
  estSortieArgent,
  validerSortieArgent,
  type SortieArgent,
} from "@/domain/validation-sensible";
import { ErreurMetier } from "@/domain/erreurs";
import type { ValidationSensibleRepository } from "../ports/validation-sensible-repository";
import type { ValidationSensible } from "@/domain/validation-sensible";

export interface DemanderSortieInput extends SortieArgent {
  tenantId: string;
  demandeurId: string;
  demandeurEmail: string;
}

export interface DeciderSortieInput {
  tenantId: string;
  validationId: string;
  decision: "approuvee" | "rejetee";
  decideurId: string;
  decideurEmail: string;
  motifDecision: string | null;
}

export interface PayerSortieInput {
  tenantId: string;
  validationId: string;
  acteurId: string;
  acteurEmail: string;
}

export class SortiesArgent {
  constructor(private readonly validations: ValidationSensibleRepository) {}

  async demander(input: DemanderSortieInput): Promise<ValidationSensible> {
    const sortie = validerSortieArgent({
      type: input.type,
      beneficiaire: input.beneficiaire,
      montantCentimes: input.montantCentimes,
      motif: input.motif,
      reference: input.reference,
    });
    const id = crypto.randomUUID();
    return this.validations.creer({
      tenantId: input.tenantId,
      type: sortie.type,
      cibleId: `sortie-${id}`,
      ref: sortie.reference || `sortie-${id.slice(0, 8)}`,
      montantCentimes: sortie.montantCentimes,
      payload: {
        beneficiaire: sortie.beneficiaire,
        motif: sortie.motif,
        reference: sortie.reference,
      },
      demandeurId: input.demandeurId,
      demandeurEmail: input.demandeurEmail,
    });
  }

  async decider(input: DeciderSortieInput): Promise<ValidationSensible> {
    const validation = await this.validations.trouverParId(
      input.tenantId,
      input.validationId,
    );
    if (
      !validation ||
      validation.statut !== "en_attente" ||
      !estSortieArgent(validation.type)
    ) {
      throw new ErreurMetier(
        "VALIDATION_SENSIBLE_INVALIDE",
        "Demande introuvable ou déjà traitée.",
      );
    }
    if (validation.demandeurId === input.decideurId) {
      throw new ErreurMetier(
        "VALIDATION_SENSIBLE_INVALIDE",
        "Le demandeur ne peut pas valider sa propre sortie.",
      );
    }

    const decidee = await this.validations.decider(
      input.tenantId,
      input.validationId,
      input.decision,
      input.decideurId,
      input.decideurEmail,
      input.motifDecision,
    );
    if (!decidee) {
      throw new ErreurMetier(
        "VALIDATION_SENSIBLE_INVALIDE",
        "Demande déjà traitée.",
      );
    }
    return decidee;
  }

  async payer(input: PayerSortieInput): Promise<ValidationSensible> {
    const validation = await this.validations.trouverParId(
      input.tenantId,
      input.validationId,
    );
    if (
      !validation ||
      validation.statut !== "approuvee" ||
      !estSortieArgent(validation.type)
    ) {
      throw new ErreurMetier(
        "VALIDATION_SENSIBLE_INVALIDE",
        "Seule une sortie approuvée peut être marquée payée.",
      );
    }

    const payee = await this.validations.marquerPayee(
      input.tenantId,
      input.validationId,
      input.acteurId,
      input.acteurEmail,
    );
    if (!payee) {
      throw new ErreurMetier(
        "VALIDATION_SENSIBLE_INVALIDE",
        "Sortie déjà payée.",
      );
    }
    return payee;
  }
}
