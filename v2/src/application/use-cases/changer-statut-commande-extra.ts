import { ErreurMetier } from "@/domain/erreurs";
import {
  TRANSITIONS_COMMANDE_EXTRA,
  type StatutCommandeExtra,
} from "@/domain/extra";
import type { CommandeExtraRepository } from "../ports/extra-repository";

export class ChangerStatutCommandeExtra {
  constructor(private readonly repo: CommandeExtraRepository) {}

  async executer(input: {
    tenantId: string;
    commandeId: string;
    statut: StatutCommandeExtra;
  }) {
    const commandes = await this.repo.listerParTenant(input.tenantId);
    const commande = commandes.find((c) => c.id === input.commandeId);
    if (!commande) {
      throw new ErreurMetier("EXTRA_INVALIDE", "Commande introuvable.");
    }
    if (commande.statut === input.statut) return commande;
    if (
      !TRANSITIONS_COMMANDE_EXTRA[commande.statut].includes(input.statut)
    ) {
      throw new ErreurMetier(
        "EXTRA_INVALIDE",
        `Transition ${commande.statut} → ${input.statut} interdite.`,
      );
    }

    const miseAJour = await this.repo.changerStatut(
      input.tenantId,
      input.commandeId,
      input.statut,
    );
    if (!miseAJour) {
      throw new ErreurMetier("EXTRA_INVALIDE", "Mise à jour impossible.");
    }
    return miseAJour;
  }
}
