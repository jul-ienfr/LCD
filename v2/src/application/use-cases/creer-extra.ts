import { ErreurMetier } from "@/domain/erreurs";
import { codeExtraValide, extraValide } from "@/domain/extra";
import type { ExtraRepository } from "../ports/extra-repository";

export interface CreerExtraInput {
  tenantId: string;
  logementId?: string | null;
  code: string;
  nom: string;
  description?: string | null;
  prixCentimes: number;
}

export class CreerExtra {
  constructor(private readonly repo: ExtraRepository) {}

  async executer(input: CreerExtraInput) {
    const code = input.code.trim().toLowerCase();
    const nom = input.nom.trim();
    const description = input.description?.trim() || null;

    if (!codeExtraValide(code)) {
      throw new ErreurMetier(
        "EXTRA_INVALIDE",
        "Code extra invalide (minuscules, chiffres, tirets).",
      );
    }
    if (!extraValide({ nom, prixCentimes: input.prixCentimes, description })) {
      throw new ErreurMetier("EXTRA_INVALIDE", "Nom, prix ou description invalide.");
    }

    return this.repo.creer({
      tenantId: input.tenantId,
      logementId: input.logementId ?? null,
      code,
      nom,
      description,
      prixCentimes: input.prixCentimes,
    });
  }
}
