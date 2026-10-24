import { ErreurMetier } from "@/domain/erreurs";
import {
  parametresFiscauxParDefaut,
  prefixeFactureValide,
  tauxTvaValide,
  type ParametresFiscaux,
} from "@/domain/fiscal";
import type { ParametresFiscauxRepository } from "../ports/parametres-fiscaux-repository";

export class ObtenirParametresFiscaux {
  constructor(private readonly repo: ParametresFiscauxRepository) {}

  async executer(tenantId: string): Promise<ParametresFiscaux> {
    return (
      (await this.repo.trouver(tenantId)) ??
      parametresFiscauxParDefaut(tenantId)
    );
  }
}

export interface EnregistrerParametresFiscauxInput {
  tenantId: string;
  tauxTvaBp: number;
  taxeSejourNuitPersonneCentimes: number;
  taxeSejourPlafondCentimes: number | null;
  prefixeFacture: string;
  mentionsLegales?: string | null;
}

export class EnregistrerParametresFiscaux {
  constructor(private readonly repo: ParametresFiscauxRepository) {}

  async executer(
    input: EnregistrerParametresFiscauxInput,
  ): Promise<ParametresFiscaux> {
    const prefixe = input.prefixeFacture.trim().toUpperCase();
    const mentions = input.mentionsLegales?.trim() || null;

    if (!tauxTvaValide(input.tauxTvaBp)) {
      throw new ErreurMetier(
        "FISCALITE_INVALIDE",
        "Le taux de TVA doit être compris entre 0 et 100 %.",
      );
    }
    if (
      !Number.isInteger(input.taxeSejourNuitPersonneCentimes) ||
      input.taxeSejourNuitPersonneCentimes < 0 ||
      input.taxeSejourNuitPersonneCentimes > 100_000
    ) {
      throw new ErreurMetier(
        "FISCALITE_INVALIDE",
        "La taxe de séjour doit être comprise entre 0 et 1 000 €.",
      );
    }
    if (
      input.taxeSejourPlafondCentimes != null &&
      (!Number.isInteger(input.taxeSejourPlafondCentimes) ||
        input.taxeSejourPlafondCentimes < 0 ||
        input.taxeSejourPlafondCentimes > 100_000)
    ) {
      throw new ErreurMetier(
        "FISCALITE_INVALIDE",
        "Le plafond de taxe de séjour est invalide.",
      );
    }
    if (!prefixeFactureValide(prefixe)) {
      throw new ErreurMetier(
        "FISCALITE_INVALIDE",
        "Le préfixe de facture doit contenir 2 à 8 caractères A-Z ou 0-9.",
      );
    }
    if (mentions && mentions.length > 2_000) {
      throw new ErreurMetier(
        "FISCALITE_INVALIDE",
        "Les mentions légales sont limitées à 2 000 caractères.",
      );
    }

    return this.repo.enregistrer({
      tenantId: input.tenantId,
      tauxTvaBp: input.tauxTvaBp,
      taxeSejourNuitPersonneCentimes: input.taxeSejourNuitPersonneCentimes,
      taxeSejourPlafondCentimes: input.taxeSejourPlafondCentimes,
      prefixeFacture: prefixe,
      mentionsLegales: mentions,
    });
  }
}
