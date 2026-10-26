import { ErreurMetier } from "@/domain/erreurs";
import type { UserRepository } from "../ports/user-repository";

export class ReinitialiserDeuxFacteurs {
  constructor(private readonly users: UserRepository) {}

  async executer(input: {
    tenantId: string;
    id: string;
    acteurId: string;
  }) {
    if (input.id === input.acteurId) {
      throw new ErreurMetier(
        "UTILISATEUR_INVALIDE",
        "Pour votre propre compte, utilisez la page Sécurité / 2FA.",
      );
    }

    const cible = await this.users.trouverParId(input.tenantId, input.id);
    if (!cible) {
      throw new ErreurMetier(
        "UTILISATEUR_INVALIDE",
        "Utilisateur introuvable.",
      );
    }
    if (!(await this.users.aDeuxFacteurs(input.tenantId, input.id))) {
      throw new ErreurMetier(
        "UTILISATEUR_INVALIDE",
        "La double authentification n’est pas active pour ce compte.",
      );
    }

    const ok = await this.users.supprimerDeuxFacteurs(
      input.tenantId,
      input.id,
    );
    if (!ok) {
      throw new ErreurMetier(
        "UTILISATEUR_INVALIDE",
        "Réinitialisation de la 2FA impossible.",
      );
    }
    return cible;
  }
}
