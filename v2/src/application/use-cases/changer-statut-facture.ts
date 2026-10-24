import { ErreurMetier } from "@/domain/erreurs";
import {
  TRANSITIONS_FACTURE,
  type StatutFacture,
} from "@/domain/facture";
import type { FactureRepository } from "../ports/facture-repository";

export class ChangerStatutFacture {
  constructor(private readonly repo: FactureRepository) {}

  async executer(input: {
    tenantId: string;
    factureId: string;
    statut: StatutFacture;
  }) {
    const facture = await this.repo.trouver(input.tenantId, input.factureId);
    if (!facture) {
      throw new ErreurMetier("FACTURE_INVALIDE", "Facture introuvable.");
    }

    if (facture.statut === input.statut) return facture;

    if (!TRANSITIONS_FACTURE[facture.statut].includes(input.statut)) {
      throw new ErreurMetier(
        "FACTURE_INVALIDE",
        `Transition ${facture.statut} → ${input.statut} interdite.`,
      );
    }

    const miseAJour = await this.repo.changerStatut(
      input.tenantId,
      input.factureId,
      input.statut,
    );
    if (!miseAJour) {
      throw new ErreurMetier("FACTURE_INVALIDE", "Mise à jour impossible.");
    }
    return miseAJour;
  }
}
