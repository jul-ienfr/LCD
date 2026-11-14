/**
 * Suivi d'audience et de publicité, consentement et événements.
 *
 * Le domaine ne connaît ni cookie, ni HTTP, ni fournisseur : il valide les
 * identifiants de mesure, sérialise le consentement et normalise les
 * événements avant stockage. Aucune donnée directement identifiante (e-mail,
 * téléphone, nom) n'est acceptée dans un événement.
 */
import { ErreurMetier } from "./erreurs";

export const CONSENTEMENT_VERSION = "2026-11";
export const CONSENTEMENT_COOKIE = "lcd_consentement";
export const CONSENTEMENT_DUREE_JOURS = 183;
export const VISITEUR_COOKIE = "lcd_visiteur";
export const VISITEUR_DUREE_JOURS = 396;

export interface Consentement {
  version: string;
  mesure: boolean;
  publicite: boolean;
}

export type CategorieSuivi = "mesure" | "publicite";

export function consentementRefuse(): Consentement {
  return { version: CONSENTEMENT_VERSION, mesure: false, publicite: false };
}

export function consentementTout(): Consentement {
  return { version: CONSENTEMENT_VERSION, mesure: true, publicite: true };
}

export function consentementAvec(
  mesure: boolean,
  publicite: boolean,
): Consentement {
  return { version: CONSENTEMENT_VERSION, mesure, publicite };
}

export function serialiserConsentement(consentement: Consentement): string {
  return `v1.m${consentement.mesure ? 1 : 0}.p${consentement.publicite ? 1 : 0}`;
}

export function lireConsentement(
  valeur: string | null | undefined,
): Consentement | null {
  if (!valeur) return null;
  const correspondance = /^v1\.m([01])\.p([01])$/.exec(valeur.trim());
  if (!correspondance) return null;
  return {
    version: CONSENTEMENT_VERSION,
    mesure: correspondance[1] === "1",
    publicite: correspondance[2] === "1",
  };
}

export function consentementPour(
  consentement: Consentement | null,
  categorie: CategorieSuivi,
): boolean {
  return consentement?.[categorie] === true;
}

export interface ConfigurationMesure {
  ga4Id: string | null;
  matomoUrl: string | null;
  matomoSiteId: string | null;
  plausibleDomain: string | null;
}

export interface ConfigurationPublicite {
  metaPixelId: string | null;
  googleAdsId: string | null;
  tiktokPixelId: string | null;
}

export interface ConfigurationSuivi {
  actif: boolean;
  mesure: ConfigurationMesure;
  publicite: ConfigurationPublicite;
}

export function configurationSuiviVide(): ConfigurationSuivi {
  return {
    actif: false,
    mesure: {
      ga4Id: null,
      matomoUrl: null,
      matomoSiteId: null,
      plausibleDomain: null,
    },
    publicite: {
      metaPixelId: null,
      googleAdsId: null,
      tiktokPixelId: null,
    },
  };
}

function texteOuNull(valeur: unknown): string | null {
  if (typeof valeur !== "string") return null;
  const propre = valeur.trim();
  return propre === "" ? null : propre;
}

function identifiant(
  valeur: unknown,
  motif: RegExp,
  libelle: string,
): string | null {
  const texte = texteOuNull(valeur);
  if (!texte) return null;
  if (!motif.test(texte)) {
    throw new ErreurMetier(
      "CONFIGURATION_INVALIDE",
      `Identifiant ${libelle} invalide.`,
    );
  }
  return texte;
}

export interface ConfigurationSuiviEntree {
  actif?: boolean;
  mesure?: Partial<ConfigurationMesure>;
  publicite?: Partial<ConfigurationPublicite>;
}

export function validerConfigurationSuivi(
  entree: ConfigurationSuiviEntree,
): ConfigurationSuivi {
  const mesure = entree.mesure ?? {};
  const publicite = entree.publicite ?? {};
  const matomoUrl = texteOuNull(mesure.matomoUrl);
  if (matomoUrl) {
    let url: URL;
    try {
      url = new URL(matomoUrl);
    } catch {
      throw new ErreurMetier(
        "CONFIGURATION_INVALIDE",
        "L’URL Matomo est invalide.",
      );
    }
    if (url.protocol !== "https:" || url.username || url.password) {
      throw new ErreurMetier(
        "CONFIGURATION_INVALIDE",
        "L’URL Matomo doit être en HTTPS, sans identifiants.",
      );
    }
  }
  return {
    actif: entree.actif === true,
    mesure: {
      ga4Id: identifiant(
        mesure.ga4Id,
        /^G-[A-Z0-9]{4,20}$/,
        "GA4 (G-…)",
      ),
      matomoUrl: matomoUrl ? matomoUrl.replace(/\/+$/, "") : null,
      matomoSiteId: identifiant(
        mesure.matomoSiteId,
        /^\d{1,12}$/,
        "Matomo (numérique)",
      ),
      plausibleDomain: identifiant(
        mesure.plausibleDomain,
        /^[a-z0-9](?:[a-z0-9.-]{0,250}[a-z0-9])?$/i,
        "Plausible (domaine)",
      ),
    },
    publicite: {
      metaPixelId: identifiant(
        publicite.metaPixelId,
        /^\d{5,25}$/,
        "Meta Pixel (numérique)",
      ),
      googleAdsId: identifiant(
        publicite.googleAdsId,
        /^AW-\d{6,20}$/,
        "Google Ads (AW-…)",
      ),
      tiktokPixelId: identifiant(
        publicite.tiktokPixelId,
        /^[A-Z0-9]{5,30}$/i,
        "TikTok (alphanumérique)",
      ),
    },
  };
}

export function configurationSuiviActive(
  configuration: ConfigurationSuivi,
): boolean {
  if (!configuration.actif) return false;
  return (
    Object.values(configuration.mesure).some(Boolean) ||
    Object.values(configuration.publicite).some(Boolean)
  );
}

export const TYPES_EVENEMENT_SUIVI = [
  "page_vue",
  "clic",
  "soumission",
  "conversion",
  "achat",
  "autre",
] as const;

export type TypeEvenementSuivi = (typeof TYPES_EVENEMENT_SUIVI)[number];

export interface CampagneSuivi {
  source?: string;
  medium?: string;
  campagne?: string;
  terme?: string;
  contenu?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
}

export interface EvenementSuivi {
  type: TypeEvenementSuivi;
  nom: string;
  page: string;
  referrer: string | null;
  campagne: CampagneSuivi;
  valeurCentimes: number | null;
  metadata: Record<string, string | number | boolean>;
}

const CHAMPS_CAMPAGNE: Record<string, keyof CampagneSuivi> = {
  utm_source: "source",
  utm_medium: "medium",
  utm_campaign: "campagne",
  utm_term: "terme",
  utm_content: "contenu",
  gclid: "gclid",
  fbclid: "fbclid",
  msclkid: "msclkid",
};

function masquerPii(valeur: string): string {
  return valeur
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[e-mail masqué]")
    .replace(/(?:\+\d[\d\s.-]{7,}\d|\b\d{9,}\b)/g, "[numéro masqué]");
}

function texteCourt(valeur: unknown, max: number): string | null {
  if (typeof valeur !== "string") return null;
  const propre = masquerPii(valeur.trim());
  if (!propre) return null;
  return propre.slice(0, max);
}

export function campagneDepuisParametres(
  parametres: URLSearchParams,
): CampagneSuivi {
  const campagne: CampagneSuivi = {};
  for (const [cle, cible] of Object.entries(CHAMPS_CAMPAGNE)) {
    const valeur = texteCourt(parametres.get(cle), 200);
    if (valeur) campagne[cible] = valeur;
  }
  return campagne;
}

export function normaliserEvenementSuivi(
  entree: unknown,
  options: { pageParDefaut?: string } = {},
): EvenementSuivi {
  if (!entree || typeof entree !== "object") {
    throw new ErreurMetier("SUIVI_INVALIDE", "Événement de suivi invalide.");
  }
  const valeur = entree as Record<string, unknown>;
  const type = valeur.type;
  if (
    typeof type !== "string" ||
    !(TYPES_EVENEMENT_SUIVI as readonly string[]).includes(type)
  ) {
    throw new ErreurMetier("SUIVI_INVALIDE", "Type d’événement inconnu.");
  }
  const page = texteCourt(valeur.page, 500) ?? options.pageParDefaut;
  if (!page || !page.startsWith("/") || page.startsWith("//")) {
    throw new ErreurMetier("SUIVI_INVALIDE", "Page de suivi invalide.");
  }
  const nom = texteCourt(valeur.nom, 120) ?? type;
  const referrer = texteCourt(valeur.referrer, 500);
  const campagne =
    valeur.campagne && typeof valeur.campagne === "object"
      ? Object.fromEntries(
          Object.entries(valeur.campagne as Record<string, unknown>)
            .slice(0, 8)
            .flatMap(([cle, brut]) => {
              if (!(cle in CHAMPS_CAMPAGNE)) return [];
              const texte = texteCourt(brut, 200);
              return texte ? [[CHAMPS_CAMPAGNE[cle]!, texte]] : [];
            }),
        )
      : {};
  const valeurCentimes =
    typeof valeur.valeurCentimes === "number" &&
    Number.isInteger(valeur.valeurCentimes) &&
    valeur.valeurCentimes >= 0 &&
    valeur.valeurCentimes <= 1_000_000_000
      ? valeur.valeurCentimes
      : null;
  const metadata: Record<string, string | number | boolean> = {};
  if (valeur.metadata && typeof valeur.metadata === "object") {
    for (const [cle, brut] of Object.entries(
      valeur.metadata as Record<string, unknown>,
    ).slice(0, 20)) {
      const nomCle = texteCourt(cle, 60);
      if (!nomCle) continue;
      if (typeof brut === "string")
        metadata[nomCle] = masquerPii(brut).slice(0, 200);
      else if (typeof brut === "number" && Number.isFinite(brut))
        metadata[nomCle] = brut;
      else if (typeof brut === "boolean") metadata[nomCle] = brut;
    }
  }
  return {
    type: type as TypeEvenementSuivi,
    nom,
    page,
    referrer,
    campagne,
    valeurCentimes,
    metadata,
  };
}
