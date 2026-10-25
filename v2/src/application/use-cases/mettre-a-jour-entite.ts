import { ErreurMetier } from "@/domain/erreurs";
import {
  adresseEntiteValide,
  mentionsEntiteValides,
  natureEntiteValide,
  nomEntiteValide,
  regimeEntiteValide,
  sirenValide,
  tvaEntiteValide,
} from "@/domain/entite";
import type { TenantRepository } from "../ports/tenant-repository";

export class MettreAJourEntite {
  constructor(private readonly tenants: TenantRepository) {}

  async executer(input: {
    tenantId: string;
    nom: string;
    nature: string;
    regime: string;
    tva: string;
    siren: string | null;
    adresse: string | null;
    mentionsLegales: string | null;
  }) {
    const nom = input.nom.trim();
    const siren = input.siren?.trim() || null;
    const adresse = input.adresse?.trim() || null;
    const mentionsLegales = input.mentionsLegales?.trim() || null;

    if (!nomEntiteValide(nom)) {
      throw new ErreurMetier(
        "TENANT_INVALIDE",
        "Le nom de l’entité doit contenir 2 à 120 caractères.",
      );
    }
    if (!natureEntiteValide(input.nature)) {
      throw new ErreurMetier("TENANT_INVALIDE", "Nature juridique inconnue.");
    }
    if (!regimeEntiteValide(input.regime)) {
      throw new ErreurMetier("TENANT_INVALIDE", "Régime fiscal inconnu.");
    }
    if (!tvaEntiteValide(input.tva)) {
      throw new ErreurMetier("TENANT_INVALIDE", "Régime de TVA inconnu.");
    }
    if (!sirenValide(siren)) {
      throw new ErreurMetier(
        "TENANT_INVALIDE",
        "Le SIREN doit contenir exactement 9 chiffres, ou rester vide.",
      );
    }
    if (!adresseEntiteValide(adresse)) {
      throw new ErreurMetier(
        "TENANT_INVALIDE",
        "L’adresse est limitée à 500 caractères.",
      );
    }
    if (!mentionsEntiteValides(mentionsLegales)) {
      throw new ErreurMetier(
        "TENANT_INVALIDE",
        "Les mentions légales sont limitées à 2 000 caractères.",
      );
    }

    const tenant = await this.tenants.mettreAJourEntite(input.tenantId, {
      nom,
      nature: input.nature,
      regime: input.regime,
      tva: input.tva,
      siren,
      adresse,
      mentionsLegales,
    });
    if (!tenant) {
      throw new ErreurMetier("TENANT_INVALIDE", "Entité introuvable.");
    }
    return tenant;
  }
}
