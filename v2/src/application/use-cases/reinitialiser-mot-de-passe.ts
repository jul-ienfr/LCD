import { ErreurMetier } from "@/domain/erreurs";
import { motDePasseValide, peutAdministrerCompte } from "@/domain/utilisateur";
import type { UserRepository } from "../ports/user-repository";

export class ReinitialiserMotDePasse {
  constructor(private readonly users: UserRepository) {}

  async executer(input: {
    tenantId: string;
    id: string;
    password: string;
    acteurRole?: string | null;
  }) {
    if (!motDePasseValide(input.password)) {
      throw new ErreurMetier(
        "UTILISATEUR_INVALIDE",
        "Le mot de passe doit contenir entre 12 et 128 caractères.",
      );
    }

    const cible = await this.users.trouverParId(input.tenantId, input.id);
    if (!cible) {
      throw new ErreurMetier(
        "UTILISATEUR_INVALIDE",
        "Utilisateur introuvable.",
      );
    }
    if (!peutAdministrerCompte(input.acteurRole, cible.role)) {
      throw new ErreurMetier(
        "UTILISATEUR_INVALIDE",
        "Seul un super-administrateur peut gérer un super-administrateur.",
      );
    }

    const ok = await this.users.reinitialiserMotDePasse(
      input.tenantId,
      input.id,
      input.password,
    );
    if (!ok) {
      throw new ErreurMetier(
        "UTILISATEUR_INVALIDE",
        "Réinitialisation impossible.",
      );
    }
    return cible;
  }
}
