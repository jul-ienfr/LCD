import { ErreurMetier } from "@/domain/erreurs";
import {
  emailUtilisateurValide,
  motDePasseValide,
  nomUtilisateurValide,
  roleUtilisateurValide,
} from "@/domain/utilisateur";
import type { UserRepository } from "../ports/user-repository";

export class CreerUtilisateur {
  constructor(private readonly users: UserRepository) {}

  async executer(input: {
    tenantId: string;
    name: string;
    email: string;
    role: string;
    password: string;
  }) {
    const nom = input.name.trim();
    const email = input.email.trim().toLowerCase();

    if (!nomUtilisateurValide(nom)) {
      throw new ErreurMetier(
        "UTILISATEUR_INVALIDE",
        "Le nom doit contenir entre 2 et 120 caractères.",
      );
    }
    if (!emailUtilisateurValide(email)) {
      throw new ErreurMetier(
        "UTILISATEUR_INVALIDE",
        "L’adresse email n’est pas valide.",
      );
    }
    if (!roleUtilisateurValide(input.role)) {
      throw new ErreurMetier("UTILISATEUR_INVALIDE", "Rôle inconnu.");
    }
    if (!motDePasseValide(input.password)) {
      throw new ErreurMetier(
        "UTILISATEUR_INVALIDE",
        "Le mot de passe doit contenir entre 12 et 128 caractères.",
      );
    }

    const existant = await this.users.trouverParEmail(email);
    if (existant) {
      throw new ErreurMetier(
        "UTILISATEUR_INVALIDE",
        "Un compte utilise déjà cette adresse email.",
      );
    }

    return this.users.creer({
      tenantId: input.tenantId,
      name: nom,
      email,
      role: input.role,
      password: input.password,
    });
  }
}
