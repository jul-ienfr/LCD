import type { TraductionsNavigation } from "@/lib/i18n-nav";
import {
  libelleNavigation,
  normaliserChemin,
  tousLesLiens,
} from "./modele";
import { NAVIGATION_STAFF } from "./navigation-staff";

export interface ElementFilAriane {
  libelle: string;
  href?: string;
}

const humaniser = (segment: string): string => {
  if (/^[0-9a-f-]{8,}$/i.test(segment)) return "Détail";
  const mots = segment.replace(/[-_]+/g, " ").trim();
  return mots.charAt(0).toUpperCase() + mots.slice(1);
};

/**
 * Fil d'Ariane de l'espace staff, dérivé de la navigation (source unique).
 * Les éléments intermédiaires connus restent cliquables ; le dernier porte
 * `aria-current="page"` côté composant.
 */
export const filArianeStaff = (
  chemin: string,
  traductions: TraductionsNavigation,
  accueilHref = "/hote",
): ElementFilAriane[] => {
  const courant = normaliserChemin(chemin);
  const racine: ElementFilAriane = {
    libelle: libelleNavigation(traductions, "tableau"),
    href: accueilHref,
  };

  if (courant === normaliserChemin(accueilHref)) return [racine];

  const correspondances = tousLesLiens(NAVIGATION_STAFF)
    .map((lien) => ({ ...lien, href: normaliserChemin(lien.href) }))
    .filter(
      (lien) =>
        lien.href !== normaliserChemin(accueilHref) &&
        (courant === lien.href || courant.startsWith(`${lien.href}/`)),
    )
    .sort((a, b) => a.href.length - b.href.length);

  const uniques: { libelle: string; href: string }[] = [];
  const vus = new Set<string>();
  for (const lien of correspondances) {
    if (vus.has(lien.href)) continue;
    vus.add(lien.href);
    uniques.push({
      libelle: libelleNavigation(traductions, lien.cle),
      href: lien.href,
    });
  }

  if (uniques.length === 0) {
    const segments = courant.split("/").filter(Boolean);
    const dernier = segments.at(-1);
    if (dernier && dernier !== "hote") {
      return [racine, { libelle: humaniser(dernier) }];
    }
    return [racine];
  }

  const elements: ElementFilAriane[] = [racine];
  uniques.forEach((element, index) => {
    if (index === uniques.length - 1) {
      elements.push({ libelle: element.libelle });
    } else {
      elements.push({ libelle: element.libelle, href: element.href });
    }
  });
  return elements;
};
