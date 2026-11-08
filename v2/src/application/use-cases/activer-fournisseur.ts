import {
  codeFournisseurValide,
  ficheFournisseur,
  type CodeFournisseur,
} from "@/domain/fournisseur";
import { ErreurMetier } from "@/domain/erreurs";
import type { FournisseurRepository } from "../ports/fournisseur-repository";

export interface ActiverFournisseurInput {
  code: string;
  actif: boolean;
  acteur: string;
}

export class ActiverFournisseur {
  constructor(private readonly repo: FournisseurRepository) {}

  async executer(input: ActiverFournisseurInput): Promise<CodeFournisseur> {
    if (!codeFournisseurValide(input.code) || !ficheFournisseur(input.code)) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        "Choisissez un fournisseur reconnu.",
      );
    }
    if (!input.actif) {
      const logements = await this.repo.listerLogementsAvecFournisseur();
      const encoreUtilise = logements?.some(
        (logement) =>
          logement.actif && logement.fournisseurCode === input.code,
      );
      if (encoreUtilise) {
        throw new ErreurMetier(
          "FOURNISSEUR_INVALIDE",
          "Ce fournisseur est encore affecté à au moins un logement. Retirez-le d’abord.",
        );
      }
    }
    await this.repo.definirActivation(input.code, input.actif, input.acteur);
    return input.code;
  }
}
