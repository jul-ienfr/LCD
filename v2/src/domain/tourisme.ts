import { ErreurMetier } from "./erreurs";

export const CATEGORIES_LIEU = [
  "visite",
  "plage",
  "pratique",
  "activite",
  "resto",
  "nature",
  "culture",
  "autre",
] as const;

export type CategorieLieu = (typeof CATEGORIES_LIEU)[number];

export type LieuTourisme = {
  id: string;
  tenantId: string;
  logementId: string | null;
  slug: string;
  nom: string;
  categorie: CategorieLieu;
  commune: string | null;
  acces: string | null;
  prixIndicatif: string | null;
  lien: string | null;
  mode: string | null;
  extraId: string | null;
  actif: boolean;
};

export type LieuTourismeInput = Omit<LieuTourisme, "id" | "actif"> & {
  id?: string;
  actif?: boolean;
};

export const LIBELLES_CATEGORIE: Record<CategorieLieu, string> = {
  visite: "Visite",
  plage: "Plage",
  pratique: "Pratique",
  activite: "Activité",
  resto: "Restaurant",
  nature: "Nature",
  culture: "Culture",
  autre: "Autre",
};

const SLUG_RE = /^[a-z0-9][a-z0-9_-]{1,63}$/;

export function categorieValide(
  categorie: string,
): categorie is CategorieLieu {
  return (CATEGORIES_LIEU as readonly string[]).includes(categorie);
}

export function slugLieuValide(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export function validerLieu(input: {
  slug: string;
  nom: string;
  categorie: string;
  lien: string | null;
}): void {
  if (!slugLieuValide(input.slug)) {
    throw new ErreurMetier(
      "TOURISME_INVALIDE",
      "Identifiant invalide : 2 à 64 caractères a-z, 0-9, tiret ou underscore.",
    );
  }
  if (input.nom.trim().length < 1 || input.nom.length > 120) {
    throw new ErreurMetier(
      "TOURISME_INVALIDE",
      "Le nom doit contenir 1 à 120 caractères.",
    );
  }
  if (!categorieValide(input.categorie)) {
    throw new ErreurMetier(
      "TOURISME_INVALIDE",
      "Catégorie inconnue.",
    );
  }
  if (input.lien && !/^https?:\/\//.test(input.lien)) {
    throw new ErreurMetier(
      "TOURISME_INVALIDE",
      "Le lien doit commencer par http:// ou https://.",
    );
  }
}

export function filtrerLieux(
  lieux: readonly LieuTourisme[],
  categorie?: string,
): LieuTourisme[] {
  if (!categorie) return [...lieux];
  if (!categorieValide(categorie)) return [];
  return lieux.filter((lieu) => lieu.categorie === categorie);
}
