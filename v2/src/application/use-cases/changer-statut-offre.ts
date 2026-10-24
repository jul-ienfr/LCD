import { ErreurMetier } from "@/domain/erreurs";
import {
  TRANSITIONS_OFFRE,
  type StatutOffre,
} from "@/domain/offre";
import type { OffreRepository } from "../ports/offre-repository";

export class ChangerStatutOffre {
  constructor(private readonly repo: OffreRepository) {}

  async executer(input: {
    tenantId: string;
    offreId: string;
    statut: StatutOffre;
  }) {
    const offre = await this.repo.trouverParId(
      input.tenantId,
      input.offreId,
    );
    if (!offre) {
      throw new ErreurMetier("OFFRE_INVALIDE", "Offre introuvable.");
    }
    if (offre.statut === input.statut) return offre;
    if (!TRANSITIONS_OFFRE[offre.statut].includes(input.statut)) {
      throw new ErreurMetier(
        "OFFRE_INVALIDE",
        `Transition ${offre.statut} → ${input.statut} interdite.`,
      );
    }

    const miseAJour = await this.repo.changerStatut(
      input.tenantId,
      input.offreId,
      input.statut,
    );
    if (!miseAJour) {
      throw new ErreurMetier("OFFRE_INVALIDE", "Mise à jour impossible.");
    }
    return miseAJour;
  }
}
