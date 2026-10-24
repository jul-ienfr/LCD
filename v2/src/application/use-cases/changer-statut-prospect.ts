import { ErreurMetier } from "@/domain/erreurs";
import {
  TRANSITIONS_PROSPECT,
  type StatutProspect,
} from "@/domain/prospect";
import type { ProspectRepository } from "../ports/prospect-repository";

export class ChangerStatutProspect {
  constructor(private readonly repo: ProspectRepository) {}

  async executer(input: {
    tenantId: string;
    prospectId: string;
    statut: StatutProspect;
  }) {
    const prospect = await this.repo.trouverParId(
      input.tenantId,
      input.prospectId,
    );
    if (!prospect) {
      throw new ErreurMetier("PROSPECT_INVALIDE", "Prospect introuvable.");
    }
    if (prospect.statut === input.statut) return prospect;
    if (!TRANSITIONS_PROSPECT[prospect.statut].includes(input.statut)) {
      throw new ErreurMetier(
        "PROSPECT_INVALIDE",
        `Transition ${prospect.statut} → ${input.statut} interdite.`,
      );
    }

    const miseAJour = await this.repo.changerStatut(
      input.tenantId,
      input.prospectId,
      input.statut,
    );
    if (!miseAJour) {
      throw new ErreurMetier("PROSPECT_INVALIDE", "Mise à jour impossible.");
    }
    return miseAJour;
  }
}
