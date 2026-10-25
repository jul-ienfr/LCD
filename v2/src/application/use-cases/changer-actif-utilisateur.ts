import { ErreurMetier } from "@/domain/erreurs";
import type { UserRepository } from "../ports/user-repository";

export class ChangerActifUtilisateur {
  constructor(private readonly users: UserRepository) {}

  async executer(input: {
    tenantId: string;
    id: string;
    actif: boolean;
    acteurId: string;
  }) {
    if (input.id === input.acteurId && !input.actif) {
      throw new ErreurMetier(
        "UTILISATEUR_INVALIDE",
        "Vous ne pouvez pas désactiver votre propre compte.",
      );
    }

    const cible = await this.users.trouverParId(input.tenantId, input.id);
    if (!cible) {
      throw new ErreurMetier(
        "UTILISATEUR_INVALIDE",
        "Utilisateur introuvable.",
      );
    }

    if (!input.actif && cible.actif && cible.role === "admin") {
      const admins = await this.users.compterActifsParRole(
        input.tenantId,
        "admin",
      );
      if (admins <= 1) {
        throw new ErreurMetier(
          "UTILISATEUR_INVALIDE",
          "Impossible de désactiver le dernier administrateur actif.",
        );
      }
    }

    const resultat = await this.users.changerActif(
      input.tenantId,
      input.id,
      input.actif,
    );
    if (!resultat) {
      throw new ErreurMetier(
        "UTILISATEUR_INVALIDE",
        "Mise à jour impossible.",
      );
    }
    return resultat;
  }
}
