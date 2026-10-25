import {
  validerLieu,
  type CategorieLieu,
  type LieuTourisme,
} from "@/domain/tourisme";
import type { LieuxTourismeRepository } from "../ports/lieux-tourisme-repository";

export class ListerLieuxTourisme {
  constructor(private readonly repo: LieuxTourismeRepository) {}

  async executer(
    tenantId: string,
    logementId: string,
    options?: { categorie?: string; inclureInactifs?: boolean },
  ): Promise<LieuTourisme[]> {
    const lieux = await this.repo.lister(tenantId, logementId, {
      inclureInactifs: options?.inclureInactifs,
    });
    if (!options?.categorie) return lieux;
    return lieux.filter((lieu) => lieu.categorie === options.categorie);
  }
}

export interface EnregistrerLieuInput {
  id?: string;
  tenantId: string;
  logementId: string | null;
  slug: string;
  nom: string;
  categorie: string;
  commune: string | null;
  acces: string | null;
  prixIndicatif: string | null;
  lien: string | null;
  mode: string | null;
  extraId: string | null;
  actif?: boolean;
}

function texteOuNull(valeur: string | null, max: number): string | null {
  const propre = valeur?.trim() ?? "";
  if (!propre) return null;
  return propre.slice(0, max);
}

export class EnregistrerLieuTourisme {
  constructor(private readonly repo: LieuxTourismeRepository) {}

  async executer(input: EnregistrerLieuInput): Promise<LieuTourisme> {
    const slug = input.slug.trim().toLowerCase();
    const nom = input.nom.trim();
    const lien = texteOuNull(input.lien, 500);

    validerLieu({
      slug,
      nom,
      categorie: input.categorie,
      lien,
    });

    return this.repo.enregistrer({
      id: input.id,
      tenantId: input.tenantId,
      logementId: input.logementId,
      slug,
      nom,
      categorie: input.categorie as CategorieLieu,
      commune: texteOuNull(input.commune, 120),
      acces: texteOuNull(input.acces, 200),
      prixIndicatif: texteOuNull(input.prixIndicatif, 60),
      lien,
      mode: texteOuNull(input.mode, 40),
      extraId: texteOuNull(input.extraId, 100),
      actif: input.actif ?? true,
    });
  }
}

export class DesactiverLieuTourisme {
  constructor(private readonly repo: LieuxTourismeRepository) {}

  async executer(tenantId: string, slug: string): Promise<void> {
    await this.repo.desactiver(tenantId, slug);
  }
}
