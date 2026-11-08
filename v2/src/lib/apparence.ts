import {
  couleurSurAccent,
  melangerCouleur,
} from "@/domain/apparence/contraste";
import { themeOuDefaut } from "@/domain/apparence/registre";
import type {
  Apparence,
  Mode,
  Palette,
  Theme,
} from "@/domain/apparence/types";

export function avecAccent(theme: Theme, accent: string | null): Theme {
  if (!accent) return theme;
  const clair: Palette = {
    ...theme.clair,
    accent,
    accentFonce: melangerCouleur(accent, "#000000", 0.18),
    accentDouce: melangerCouleur(accent, theme.clair.surface, 0.88),
  };
  const sombre: Palette = {
    ...theme.sombre,
    accent: melangerCouleur(accent, "#ffffff", 0.45),
    accentFonce: melangerCouleur(accent, "#ffffff", 0.6),
    accentDouce: melangerCouleur(accent, theme.sombre.fond, 0.82),
  };
  return { ...theme, clair, sombre };
}

export function themeResolu(apparence: Apparence): Theme {
  return avecAccent(themeOuDefaut(apparence.themeId), apparence.accent);
}

export function jetonsCouleur(
  theme: Theme,
  mode: Mode,
): Record<string, string> {
  const palette = mode === "clair" ? theme.clair : theme.sombre;
  return {
    "--fond": palette.fond,
    "--surface": palette.surface,
    "--surface-2": palette.surface2,
    "--bordure": palette.bordure,
    "--encre": palette.encre,
    "--encre-douce": palette.encreDouce,
    "--encre-faine": palette.encreFaine,
    "--accent": palette.accent,
    "--accent-fonce": palette.accentFonce,
    "--accent-douce": palette.accentDouce,
    "--sur-accent": couleurSurAccent(palette.accent),
  };
}

export function jetonsCommuns(theme: Theme): Record<string, string> {
  return {
    "--police-texte": theme.typographie.policeTexte,
    "--police-titre": theme.typographie.policeTitre,
    "--police-mono": theme.typographie.policeMono,
    "--graisse-titre": String(theme.typographie.graisseTitre),
    "--interlettrage-titre": theme.typographie.interlettrageTitre,
    "--rayon-controle": theme.formes.rayonControle,
    "--rayon-carte": theme.formes.rayonCarte,
    "--rayon-grand": theme.formes.rayonGrand,
    "--rayon-bouton": theme.formes.rayonBouton,
    "--bordure-largeur": theme.formes.bordureLargeur,
    "--ombre-carte": theme.ombres.carte,
    "--ombre-elevee": theme.ombres.elevee,
    "--espace-section": theme.densite.espaceSection,
    "--espace-carte": theme.densite.espaceCarte,
    "--hauteur-controle": theme.densite.hauteurControle,
  };
}

function declarations(jetons: Record<string, string>): string {
  return Object.entries(jetons)
    .map(([cle, valeur]) => `${cle}:${valeur};`)
    .join("");
}

export function styleTheme(theme: Theme): string {
  const communs = declarations(jetonsCommuns(theme));
  const clair = declarations(jetonsCouleur(theme, "clair"));
  const sombre = declarations(jetonsCouleur(theme, "sombre"));
  return [
    `:root:root{${clair}${communs}}`,
    `@media (prefers-color-scheme: dark){:root:root:not(.theme-clair){${sombre}}}`,
    `:root:root.theme-sombre{${sombre}}`,
  ].join("");
}

export type PaletteEmail = {
  fond: string;
  surface: string;
  encre: string;
  encreDouce: string;
  accent: string;
  surAccent: string;
  bordure: string;
  nom: string;
};

/**
 * Les clients e-mail ne comprennent pas les variables CSS : on résout des
 * couleurs hexadécimales, toujours sur la palette claire (lisibilité imprimée).
 */
export function paletteEmail(
  theme: Theme,
  nom: string,
): PaletteEmail {
  return {
    fond: theme.clair.fond,
    surface: theme.clair.surface,
    encre: theme.clair.encre,
    encreDouce: theme.clair.encreDouce,
    accent: theme.clair.accent,
    surAccent: couleurSurAccent(theme.clair.accent),
    bordure: theme.clair.bordure,
    nom,
  };
}

export function habillerEmail(
  texte: string,
  palette: PaletteEmail,
): string {
  const paragraphes = texte
    .split(/\n{2,}/u)
    .map(
      (bloc) =>
        `<p style="margin:0 0 14px;line-height:1.55;color:${palette.encre}">${bloc
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll("\n", "<br>")}</p>`,
    )
    .join("");
  return `<!doctype html><html lang="fr"><body style="margin:0;background:${palette.fond};padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:${palette.surface};border:1px solid ${palette.bordure};border-radius:12px">
<tr><td style="padding:20px 24px;border-bottom:3px solid ${palette.accent};font-weight:700;font-size:16px;color:${palette.encre}">${palette.nom}</td></tr>
<tr><td style="padding:24px;font-size:15px">${paragraphes}</td></tr>
</table>
<p style="max-width:600px;margin:16px auto 0;font-size:12px;color:${palette.encreDouce};text-align:center">Message automatique — merci de ne pas répondre directement à cette adresse.</p>
</body></html>`;
}
