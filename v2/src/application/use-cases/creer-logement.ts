import {
  codeLogementValide,
  nomLogementValide,
  type Logement,
} from "@/domain/logement";
import { ErreurMetier } from "@/domain/erreurs";
import type { TenantId } from "@/domain/tenant";
import type { LogementRepository } from "../ports/logement-repository";

export interface CreerLogementInput {
  tenantId: TenantId;
  code: string;
  nom: string;
  adresse?: string;
}

/**
 * Cas d'usage : créer un logement pour un tenant.
 * Ne connaît ni Next, ni Drizzle, ni HTTP : uniquement le port de dépôt.
 */
export class CreerLogement {
  constructor(private readonly repo: LogementRepository) {}

  async executer(input: CreerLogementInput): Promise<Logement> {
    const tenantId = input.tenantId.trim();
    const code = input.code.trim().toLowerCase();
    const nom = input.nom.trim();
    const adresse = input.adresse?.trim() || undefined;

    if (!tenantId) {
      throw new ErreurMetier("TENANT_INVALIDE", "tenantId est requis.");
    }
    if (!codeLogementValide(code)) {
      throw new ErreurMetier(
        "CODE_INVALIDE",
        "Le code logement doit faire 2 à 32 caractères (a-z, 0-9, tirets).",
      );
    }
    if (!nomLogementValide(nom)) {
      throw new ErreurMetier(
        "NOM_INVALIDE",
        "Le nom du logement doit faire 2 à 120 caractères.",
      );
    }

    const existant = await this.repo.trouverParCode(tenantId, code);
    if (existant) {
      throw new ErreurMetier(
        "LOGEMENT_DEJA_EXISTANT",
        `Le logement « ${code} » existe déjà pour ce tenant.`,
      );
    }

    return this.repo.creer({ tenantId, code, nom, adresse });
  }
}
