import { ErreurMetier } from "@/domain/erreurs";
import {
  peutAdministrerCompte,
  peutAttribuerRole,
  roleUtilisateurValide,
} from "@/domain/utilisateur";
import type { UserRepository } from "../ports/user-repository";

export class ChangerRoleUtilisateur {
  constructor(private readonly users: UserRepository) {}

  async executer(input: {
    tenantId: string;
    id: string;
    role: string;
    acteurId: string;
    acteurRole?: string | null;
  }) {
    if (input.id === input.acteurId) {
      throw new ErreurMetier(
        "UTILISATEUR_INVALIDE",
        "Vous ne pouvez pas modifier votre propre rôle.",
      );
    }
    if (!roleUtilisateurValide(input.role)) {
      throw new ErreurMetier("UTILISATEUR_INVALIDE", "Rôle inconnu.");
    }

    const cible = await this.users.trouverParId(input.tenantId, input.id);
    if (!cible) {
      throw new ErreurMetier(
        "UTILISATEUR_INVALIDE",
        "Utilisateur introuvable.",
      );
    }
    if (
      !peutAdministrerCompte(input.acteurRole, cible.role) ||
      !peutAttribuerRole(input.acteurRole, input.role)
    ) {
      throw new ErreurMetier(
        "UTILISATEUR_INVALIDE",
        "Seul un super-administrateur peut gérer le rôle super-administrateur.",
      );
    }
    if (cible.role === input.role) {
      return cible;
    }

    if (cible.role === "admin" && input.role !== "admin" && cible.actif) {
      const admins = await this.users.compterActifsParRole(
        input.tenantId,
        "admin",
      );
      if (admins <= 1) {
        throw new ErreurMetier(
          "UTILISATEUR_INVALIDE",
          "Impossible de retirer le rôle du dernier administrateur actif.",
        );
      }
    }

    const resultat = await this.users.changerRole(
      input.tenantId,
      input.id,
      input.role,
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
