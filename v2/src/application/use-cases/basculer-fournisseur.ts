import { ErreurMetier } from "@/domain/erreurs";
import type { FournisseurRepository } from "../ports/fournisseur-repository";

/**
 * Pause ou reprise d'une affectation fournisseur sans supprimer le mapping.
 * À la pause, la V2 cesse de pousser l'ARI ; le flux iCal du logement reste
 * actif, ce qui constitue le retour immédiat au mode secours.
 */
export class BasculerFournisseur {
  constructor(private readonly fournisseurs: FournisseurRepository) {}

  async executer(input: {
    tenantId: string;
    logementId: string;
    actif: boolean;
  }) {
    const affectation = await this.fournisseurs.trouverAffectation(
      input.tenantId,
      input.logementId,
    );
    if (!affectation) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        "Aucun fournisseur n’est affecté à ce logement.",
      );
    }

    if (input.actif) {
      const activations = await this.fournisseurs.listerActivations();
      const activation = activations?.find(
        (entree) => entree.code === affectation.fournisseurCode,
      );
      if (activations && !activation?.actif) {
        throw new ErreurMetier(
          "FOURNISSEUR_INVALIDE",
          `Le fournisseur ${affectation.fournisseurCode} est désactivé par le super-admin.`,
        );
      }
    }

    const resultat = await this.fournisseurs.basculerActivation(
      input.tenantId,
      input.logementId,
      input.actif,
    );
    if (!resultat) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        "Bascule de l’affectation impossible.",
      );
    }
    return resultat;
  }
}
