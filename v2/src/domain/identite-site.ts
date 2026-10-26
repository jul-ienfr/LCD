import {
  contraste,
  couleurHexValide,
  melangerCouleur,
} from "./apparence/contraste";
import { themeOuDefaut } from "./apparence/registre";

export interface IdentiteSite {
  nom: string;
  logoUrl: string | null;
  emailContact: string | null;
  telephoneContact: string | null;
  adresseContact: string | null;
  accent: string | null;
}

export const IDENTITE_SANS_MARQUE: Omit<IdentiteSite, "nom"> = {
  logoUrl: null,
  emailContact: null,
  telephoneContact: null,
  adresseContact: null,
  accent: null,
};

export { contraste, couleurHexValide, melangerCouleur };

export function urlLogoValide(valeur: string): boolean {
  if (valeur.length > 500 || valeur.startsWith("//")) return false;
  if (valeur.startsWith("/")) return !valeur.includes("\\");
  try {
    const url = new URL(valeur);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function emailContactValide(valeur: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(valeur);
}

export function telephoneContactValide(valeur: string): boolean {
  return /^\+?[0-9 ().-]{6,30}$/u.test(valeur);
}

export function adresseContactValide(valeur: string): boolean {
  return valeur.length <= 200 && !/[<>]/u.test(valeur);
}

export function nomMarqueValide(valeur: string): boolean {
  return valeur.length >= 2 && valeur.length <= 60 && !/[<>]/u.test(valeur);
}

/**
 * Couleur d'accent lisible sur le thème par défaut, en clair comme en sombre.
 * Conservé pour les appels historiques ; la validation d'un thème donné passe
 * par `accentValidePourTheme`.
 */
export function accentContrasteSuffisant(couleur: string): boolean {
  if (!couleurHexValide(couleur)) return false;
  const theme = themeOuDefaut(null);
  const clair =
    contraste(couleur, theme.clair.surface) >= 4.5 &&
    contraste(couleur, theme.clair.fond) >= 4.5;
  const sombreAccent = melangerCouleur(couleur, "#ffffff", 0.45);
  const sombre =
    contraste(sombreAccent, theme.sombre.surface) >= 4.5 &&
    contraste(sombreAccent, theme.sombre.fond) >= 4.5;
  return clair && sombre;
}

export function styleIdentite(accent: string | null): string {
  if (!accent || !couleurHexValide(accent)) return "";
  const fonceClair = melangerCouleur(accent, "#000000", 0.18);
  const douceClair = melangerCouleur(accent, "#ffffff", 0.88);
  const sombreAccent = melangerCouleur(accent, "#ffffff", 0.45);
  const sombreFonce = melangerCouleur(accent, "#ffffff", 0.6);
  const sombreDouce = melangerCouleur(accent, "#0b0e14", 0.82);
  const css = (a: string, f: string, d: string) =>
    `--accent:${a};--accent-fonce:${f};--accent-douce:${d};`;
  return [
    `:root:root{${css(accent, fonceClair, douceClair)}}`,
    `@media (prefers-color-scheme: dark){:root:root:not(.theme-clair){${css(sombreAccent, sombreFonce, sombreDouce)}}}`,
    `:root:root.theme-sombre{${css(sombreAccent, sombreFonce, sombreDouce)}}`,
  ].join("");
}
