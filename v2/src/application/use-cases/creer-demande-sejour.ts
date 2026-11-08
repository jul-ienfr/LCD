import { ErreurMetier } from "@/domain/erreurs";
import { validerDemandeSejour } from "@/domain/demande-sejour";
import type { DemandeSejourRepository } from "../ports/demande-sejour-repository";

export interface CreerDemandeSejourInput {
  tenantId: string;
  nom: string;
  email: string;
  telephone?: string | null;
  arrivee?: string | null;
  depart?: string | null;
  voyageurs?: number;
  message?: string | null;
  logementId?: string | null;
  source?: string;
  /** Référence stable : un rejeu de formulaire ne crée pas de doublon. */
  ref: string;
}

/**
 * Cas d'usage : enregistrer une demande de séjour (enquiry) arrivée du site
 * public. La demande n'engage rien : elle alimente le pipeline commercial.
 */
export class CreerDemandeSejour {
  constructor(private readonly repo: DemandeSejourRepository) {}

  async executer(input: CreerDemandeSejourInput) {
    if (!input.tenantId) {
      throw new ErreurMetier("TENANT_INVALIDE", "Tenant requis.");
    }
    const ref = input.ref.trim();
    if (ref.length < 3 || ref.length > 40) {
      throw new ErreurMetier(
        "SITE_INVALIDE",
        "Référence de demande invalide (3 à 40 caractères).",
      );
    }
    validerDemandeSejour(input);

    const existante = await this.repo.trouverParRef(input.tenantId, ref);
    if (existante) return { demande: existante, dejaEnregistree: true };

    const demande = await this.repo.creer({
      tenantId: input.tenantId,
      ref,
      logementId: input.logementId ?? null,
      nom: input.nom.trim(),
      email: input.email.trim().toLowerCase(),
      telephone: input.telephone?.trim() || null,
      arrivee: input.arrivee?.trim() || null,
      depart: input.depart?.trim() || null,
      voyageurs: input.voyageurs ?? 1,
      message: input.message?.trim() || null,
      source: (input.source ?? "site").trim().slice(0, 60) || "site",
    });

    return { demande, dejaEnregistree: false };
  }
}
