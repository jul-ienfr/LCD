import { ErreurMetier } from "@/domain/erreurs";
import { nomEntiteValide } from "@/domain/entite";
import { slugValide, type Tenant } from "@/domain/tenant";
import type { Logement } from "@/domain/logement";
import type { UtilisateurTenant } from "../ports/user-repository";
import type { LogementRepository } from "../ports/logement-repository";
import type { TenantRepository } from "../ports/tenant-repository";
import type { UserRepository } from "../ports/user-repository";
import { CreerLogement } from "./creer-logement";
import { CreerUtilisateur } from "./creer-utilisateur";

export interface CreerEspaceInput {
  /** Rôle de l'acteur : seul un super-admin crée un espace. */
  acteurRole: string | null | undefined;
  slug: string;
  nom: string;
  adminNom: string;
  adminEmail: string;
  adminPassword: string;
  logementCode: string;
  logementNom: string;
  logementAdresse?: string;
}

export interface EspaceCree {
  tenant: Tenant;
  admin: UtilisateurTenant;
  logement: Logement;
}

/**
 * Cas d'usage FR-018 : créer un espace complet depuis la supervision —
 * tenant, compte administrateur et premier logement — sans SSH.
 *
 * Les validations partagées (email, mot de passe, code logement…) restent
 * portées par `CreerUtilisateur` et `CreerLogement` : une seule source de
 * vérité. Les contrôles qui doivent précéder toute écriture (slug unique,
 * email libre) sont faits avant la création du tenant.
 *
 * Si une étape échoue après la création du tenant, la compensation supprime
 * l'espace : la cascade de clés étrangères emporte compte, logement et
 * journaux. Un espace à moitié créé ne doit jamais rester.
 */
export class CreerEspace {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly users: UserRepository,
    private readonly logements: LogementRepository,
  ) {}

  async executer(input: CreerEspaceInput): Promise<EspaceCree> {
    if (input.acteurRole !== "super_admin") {
      throw new ErreurMetier(
        "NON_AUTORISE",
        "Seul un super-administrateur peut créer un espace.",
      );
    }

    const slug = input.slug.trim().toLowerCase();
    const nom = input.nom.trim();

    if (!slugValide(slug)) {
      throw new ErreurMetier(
        "TENANT_INVALIDE",
        "Le slug doit être en minuscules (chiffres et tirets acceptés, 40 caractères maximum).",
      );
    }
    if (!nomEntiteValide(nom)) {
      throw new ErreurMetier(
        "TENANT_INVALIDE",
        "Le nom de l’espace doit faire 2 à 120 caractères.",
      );
    }

    const existant = await this.tenants.trouverParSlug(slug);
    if (existant) {
      throw new ErreurMetier(
        "TENANT_INVALIDE",
        `Le slug « ${slug} » est déjà utilisé.`,
      );
    }

    const email = input.adminEmail.trim().toLowerCase();
    const dejaCompte = await this.users.trouverParEmail(email);
    if (dejaCompte) {
      throw new ErreurMetier(
        "UTILISATEUR_INVALIDE",
        "Un compte utilise déjà cette adresse email.",
      );
    }

    const tenant = await this.tenants.creer({ slug, nom });

    try {
      const admin = await new CreerUtilisateur(this.users).executer({
        tenantId: tenant.id,
        name: input.adminNom,
        email: input.adminEmail,
        role: "admin",
        password: input.adminPassword,
        acteurRole: input.acteurRole,
      });
      const logement = await new CreerLogement(this.logements).executer({
        tenantId: tenant.id,
        code: input.logementCode,
        nom: input.logementNom,
        adresse: input.logementAdresse,
      });
      return { tenant, admin, logement };
    } catch (erreur) {
      await this.compenser(tenant.id, erreur);
      throw erreur;
    }
  }

  private async compenser(tenantId: string, erreur: unknown): Promise<void> {
    try {
      await this.tenants.supprimer(tenantId);
    } catch {
      const detail =
        erreur instanceof Error ? erreur.message : "échec inconnu";
      throw new ErreurMetier(
        "TENANT_INVALIDE",
        `Création interrompue (${detail}) et nettoyage incomplet : vérifiez la liste des espaces avant de réessayer.`,
      );
    }
  }
}
