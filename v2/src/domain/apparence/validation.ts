import {
  adresseContactValide,
  emailContactValide,
  nomMarqueValide,
  telephoneContactValide,
  urlLogoValide,
  type IdentiteSite,
} from "../identite-site";
import {
  contraste,
  couleurHexValide,
  melangerCouleur,
} from "./contraste";
import {
  THEME_DEFAUT,
  estThemeValide,
  themeParId,
} from "./registre";
import {
  APPARENCE_SCHEMA_VERSION,
  IDENTITE_DEFAUT,
  type Apparence,
  type Theme,
} from "./types";

export function texteOuNull(valeur: unknown, max = 500): string | null {
  if (typeof valeur !== "string") return null;
  const propre = valeur.trim();
  return propre && propre.length <= max ? propre : null;
}

export function normaliserIdentite(
  valeur: unknown,
  secours: IdentiteSite = IDENTITE_DEFAUT,
): IdentiteSite {
  const brut =
    valeur && typeof valeur === "object"
      ? (valeur as Record<string, unknown>)
      : {};
  const nomBrut = texteOuNull(brut.nom, 60);
  return {
    nom: nomBrut && nomMarqueValide(nomBrut) ? nomBrut : secours.nom,
    logoUrl:
      typeof brut.logoUrl === "string" && urlLogoValide(brut.logoUrl.trim())
        ? brut.logoUrl.trim()
        : null,
    emailContact:
      typeof brut.emailContact === "string" &&
      emailContactValide(brut.emailContact.trim())
        ? brut.emailContact.trim().toLowerCase()
        : null,
    telephoneContact:
      typeof brut.telephoneContact === "string" &&
      telephoneContactValide(brut.telephoneContact.trim())
        ? brut.telephoneContact.trim()
        : null,
    adresseContact:
      typeof brut.adresseContact === "string" &&
      adresseContactValide(brut.adresseContact.trim())
        ? brut.adresseContact.trim()
        : null,
    accent:
      typeof brut.accent === "string" && couleurHexValide(brut.accent)
        ? brut.accent.toLowerCase()
        : null,
  };
}

/**
 * Un accent personnalisé doit rester lisible sur les surfaces du thème, en
 * clair comme en sombre (le mode sombre éclaircit l'accent de 45 %).
 */
export function accentValidePourTheme(
  accent: string,
  theme: Theme,
): boolean {
  if (!couleurHexValide(accent)) return false;
  const clair =
    contraste(accent, theme.clair.surface) >= 4.5 &&
    contraste(accent, theme.clair.fond) >= 4.5;
  const sombreAccent = melangerCouleur(accent, "#ffffff", 0.45);
  const sombre =
    contraste(sombreAccent, theme.sombre.surface) >= 4.5 &&
    contraste(sombreAccent, theme.sombre.fond) >= 4.5;
  return clair && sombre;
}

export function normaliserApparence(
  valeur: unknown,
  secours: IdentiteSite = IDENTITE_DEFAUT,
): Apparence {
  const brut =
    valeur && typeof valeur === "object"
      ? (valeur as Record<string, unknown>)
      : {};
  const themeId =
    typeof brut.themeId === "string" && estThemeValide(brut.themeId)
      ? brut.themeId
      : THEME_DEFAUT;
  const theme = themeParId(themeId)!;
  const accentBrut =
    typeof brut.accent === "string" ? brut.accent.trim().toLowerCase() : "";
  const accent =
    accentBrut && accentValidePourTheme(accentBrut, theme)
      ? accentBrut
      : null;
  const identite = normaliserIdentite(
    brut.identite ?? { nom: brut.nom },
    secours,
  );
  return {
    schemaVersion: APPARENCE_SCHEMA_VERSION,
    themeId,
    accent,
    identite: { ...identite, accent },
  };
}

export function apparenceDepuisAnciennesCles(
  design: string | null,
  identiteBrute: unknown,
): Apparence {
  return normaliserApparence({
    themeId: design ?? THEME_DEFAUT,
    accent:
      identiteBrute &&
      typeof identiteBrute === "object" &&
      typeof (identiteBrute as Record<string, unknown>).accent === "string"
        ? (identiteBrute as Record<string, unknown>).accent
        : null,
    identite: normaliserIdentite(identiteBrute),
  });
}
