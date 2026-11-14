/**
 * Garde-fous de thème (T098 / T099).
 *
 * Contrat : `specs/004-ergonomie-experience-client/contracts/ergonomie.md`
 * (contraste texte ≥ 4,5:1, cible tactile ≥ 44 px) et WCAG 2.2 AA.
 *
 * Le calcul de contraste existe déjà dans le domaine
 * (`@/domain/apparence/contraste`) : ce module ne le réimplémente pas, il
 * l'expose sous l'API attendue par le plan 004 — `contraste(min, max)`,
 * `ratioContraste(theme, mode)` — et ajoute les seuils, la liste des
 * vérifications et la décision de publication.
 *
 * Tout ici est **pur** : aucun import SvelteKit, Drizzle ou base de données.
 */
import {
  contraste as ratioWcag,
  couleurHexValide,
} from "@/domain/apparence/contraste";
import { THEMES } from "@/domain/apparence/registre";
import type {
  Apparence,
  Mode,
  Palette,
  Theme,
} from "@/domain/apparence/types";

/** Seuil WCAG AA pour le texte courant (contrat d'ergonomie). */
export const SEUIL_CONTRASTE_TEXTE = 4.5;

/** Seuil WCAG AA pour le texte large et les éléments non textuels. */
export const SEUIL_CONTRASTE_LARGE = 3;

/** Cible tactile minimale, en pixels (contracts/ergonomie.md §1). */
export const SEUIL_CIBLE_PX = 44;

/** Correspondance entre les unités CSS et les pixels de référence (16 px). */
const PX_PAR_UNITE: Record<string, number> = {
  px: 1,
  rem: 16,
  em: 16,
  pt: 1.3333,
  "%": 0, // non convertible sans contexte : ignoré
};

/** Convertit une longueur CSS (`2.75rem`, `40px`) en pixels. */
export function enPixels(valeur: string | number | null | undefined): number | null {
  if (typeof valeur === "number") {
    return Number.isFinite(valeur) ? valeur : null;
  }
  if (typeof valeur !== "string") return null;
  const correspondance = /^([\d.]+)\s*(px|rem|em|pt)?$/.exec(valeur.trim());
  if (!correspondance) return null;
  const nombre = Number.parseFloat(correspondance[1] ?? "");
  if (!Number.isFinite(nombre)) return null;
  const facteur = PX_PAR_UNITE[correspondance[2] ?? "px"];
  if (!facteur) return null;
  return Math.round(nombre * facteur * 100) / 100;
}

/**
 * Ratio de contraste WCAG entre deux couleurs.
 *
 * @param min couleur la plus sombre (ignorée : seul le ratio compte)
 * @param max couleur la plus claire
 * @returns ratio entre 1 et 21, ou 0 si une couleur est illisible
 */
export function contraste(min: string, max: string): number {
  if (!couleurHexValide(min) || !couleurHexValide(max)) {
    return 0;
  }
  return Math.round(ratioWcag(min, max) * 100) / 100;
}

const PAIRES_TEXTE = [
  { libelle: "Texte principal sur le fond", texte: "encre", fond: "fond" },
  { libelle: "Texte principal sur surface", texte: "encre", fond: "surface" },
  { libelle: "Texte principal sur surface 2", texte: "encre", fond: "surface2" },
  { libelle: "Texte secondaire sur le fond", texte: "encreDouce", fond: "fond" },
  { libelle: "Texte secondaire sur surface", texte: "encreDouce", fond: "surface" },
  { libelle: "Texte tertiaire sur le fond", texte: "encreFaine", fond: "fond" },
  { libelle: "Texte tertiaire sur surface", texte: "encreFaine", fond: "surface" },
  { libelle: "Accent sur le fond", texte: "accent", fond: "fond" },
  { libelle: "Accent sur surface", texte: "accent", fond: "surface" },
  { libelle: "Accent foncé sur surface", texte: "accentFonce", fond: "surface" },
  { libelle: "Texte de marque sur accent doux", texte: "accentFonce", fond: "accentDouce" },
] as const satisfies readonly { libelle: string; texte: keyof Palette; fond: keyof Palette }[];

/**
 * Contrôles de contraste d'une palette.
 *
 * @param seuilTexte seuil du texte courant (4,5:1 par défaut)
 */
export function verifierPalette(palette: Palette, seuilTexte = SEUIL_CONTRASTE_TEXTE) {
  const echecs: {
    libelle: string;
    texte: string;
    fond: string;
    ratio: number;
    seuil: number;
  }[] = [];
  const mesures: { libelle: string; ratio: number; seuil: number }[] = [];

  for (const paire of PAIRES_TEXTE) {
    const couleurTexte = palette[paire.texte];
    const couleurFond = palette[paire.fond];
    const ratio = contraste(couleurTexte, couleurFond);
    mesures.push({ libelle: paire.libelle, ratio, seuil: seuilTexte });
    if (ratio < seuilTexte) {
      echecs.push({
        libelle: paire.libelle,
        texte: couleurTexte,
        fond: couleurFond,
        ratio,
        seuil: seuilTexte,
      });
    }
  }

  // Le texte posé sur l'accent (bouton primaire) doit rester lisible : on
  // retient la meilleure des deux encres possibles, comme `jetonsCouleur`.
  const surAccent =
    contraste(palette.accent, "#ffffff") >= contraste(palette.accent, "#0b0e14")
      ? "#ffffff"
      : "#0b0e14";
  const ratioSurAccent = contraste(palette.accent, surAccent);
  mesures.push({
    libelle: "Texte du bouton primaire sur l'accent",
    ratio: ratioSurAccent,
    seuil: seuilTexte,
  });
  if (ratioSurAccent < seuilTexte) {
    echecs.push({
      libelle: "Texte du bouton primaire sur l'accent",
      texte: surAccent,
      fond: palette.accent,
      ratio: ratioSurAccent,
      seuil: seuilTexte,
    });
  }

  return { mesures, echecs };
}

/** Contrôles de contraste d'un thème, en clair et en sombre. */
export function ratioContraste(theme: Theme, mode?: Mode) {
  const modes: Mode[] = mode ? [mode] : ["clair", "sombre"];
  return modes.map((m) => ({
    themeId: theme.id,
    themeNom: theme.nom,
    mode: m,
    ...verifierPalette(m === "clair" ? theme.clair : theme.sombre),
  }));
}

export interface EchecContraste {
  themeId: string;
  themeNom: string;
  mode: Mode;
  libelle: string;
  texte: string;
  fond: string;
  ratio: number;
  seuil: number;
}

/** Tous les échecs de contraste d'un thème (clair et sombre par défaut). */
export function echecsContraste(theme: Theme, mode?: Mode): EchecContraste[] {
  return ratioContraste(theme, mode).flatMap((resultat) =>
    resultat.echecs.map((echec) => ({
      themeId: theme.id,
      themeNom: theme.nom,
      mode: resultat.mode,
      ...echec,
    })),
  );
}

/**
 * Hauteur de contrôle déclarée par le thème, en pixels.
 * `null` si le thème n'en déclare pas (aucun blocage dans ce cas).
 */
export function hauteurCiblePx(theme: Theme): number | null {
  return enPixels(theme.densite?.hauteurControle);
}

/** Vrai si la hauteur de contrôle du thème respecte la cible tactile 44 px. */
export function cibleSuffisante(theme: Theme): boolean {
  const hauteur = hauteurCiblePx(theme);
  if (hauteur === null) return true;
  return hauteur >= SEUIL_CIBLE_PX;
}

export interface ProblemeTheme {
  type: "contraste" | "cible";
  themeId: string;
  message: string;
  details: string[];
}

export interface RapportValidationTheme {
  ok: boolean;
  themeId: string;
  themeNom: string;
  /** `null` si le thème n'a pas pu être résolu. */
  hauteurCiblePx: number | null;
  echecsContraste: EchecContraste[];
  problemes: ProblemeTheme[];
  message: string | null;
}

/** Formate un ratio sans fausse précision. */
function formaterRatio(ratio: number): string {
  return `${ratio.toFixed(2).replace(/\.?0+$/, "")}:1`;
}

/**
 * Valide le thème d'une apparence avant publication.
 *
 * Bloque si un contraste de texte est < 4,5:1 ou si la hauteur de contrôle est
 * < 44 px. Le message est actionnable : il nomme le thème, le mode, la paire de
 * couleurs et la correction attendue.
 */
export function validerThemePourPublication(theme: Theme): RapportValidationTheme {
  const echecs = echecsContraste(theme);
  const hauteur = hauteurCiblePx(theme);
  const problemes: ProblemeTheme[] = [];

  if (echecs.length > 0) {
    problemes.push({
      type: "contraste",
      themeId: theme.id,
      message: `Publication bloquée : ${echecs.length} contraste(s) sous ${SEUIL_CONTRASTE_TEXTE}:1 dans le thème « ${theme.nom} ».`,
      details: echecs.map(
        (echec) =>
          `${echec.mode} · ${echec.libelle} : ${echec.texte} sur ${echec.fond} = ${formaterRatio(echec.ratio)} (minimum ${SEUIL_CONTRASTE_TEXTE}:1)`,
      ),
    });
  }

  if (hauteur !== null && hauteur < SEUIL_CIBLE_PX) {
    problemes.push({
      type: "cible",
      themeId: theme.id,
      message: `Publication bloquée : la hauteur de contrôle du thème « ${theme.nom} » est de ${hauteur} px, sous la cible tactile de ${SEUIL_CIBLE_PX} px.`,
      details: [
        `densite.hauteurControle = « ${theme.densite.hauteurControle} » (${hauteur} px)`,
        `Correction : passer densite.hauteurControle à 2.75rem (44 px) minimum dans @/domain/apparence/registre.`,
      ],
    });
  }

  return {
    ok: problemes.length === 0,
    themeId: theme.id,
    themeNom: theme.nom,
    hauteurCiblePx: hauteur,
    echecsContraste: echecs,
    problemes,
    message: problemes[0]?.message ?? null,
  };
}

/** Valide l'apparence (thème résolu + accent) avant publication. */
export function validerApparencePourPublication(
  apparence: Pick<Apparence, "themeId">,
  theme: Theme,
): RapportValidationTheme {
  return validerThemePourPublication(theme);
}

/** Contrôle des six thèmes du registre, en clair et en sombre. */
export function verifierTousLesThemes(themes: readonly Theme[] = THEMES) {
  const resultats = themes.map((theme) => ({
    themeId: theme.id,
    themeNom: theme.nom,
    hauteurPx: hauteurCiblePx(theme),
    modes: ratioContraste(theme),
    echecs: echecsContraste(theme),
    validation: validerThemePourPublication(theme),
  }));
  const echecs = resultats.flatMap((resultat) =>
    resultat.echecs.map((echec) => ({ ...echec })),
  );
  return {
    themes: resultats,
    echecs,
    resume: {
      themes: resultats.length,
      paires: resultats.reduce(
        (total, resultat) =>
          total + resultat.modes.reduce((somme, mode) => somme + mode.mesures.length, 0),
        0,
      ),
      echecs: echecs.length,
      ok: echecs.length === 0 && resultats.every((r) => r.validation.ok),
    },
  };
}
