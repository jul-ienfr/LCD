/**
 * T600 — Domaine guide voyageur (sections, langues, lien signé).
 *
 * Domaine pur : aucune dépendance SvelteKit, Drizzle, Stripe, Brevo ou S3.
 * Seule la cryptographie native (`node:crypto`) est utilisée, le secret HMAC
 * étant injecté par l'appelant (jamais lu depuis l'environnement ici).
 *
 * Le guide d'un logement est consultable par le voyageur via un lien signé
 * HMAC, sans compte. La signature DOIT être vérifiée avant toute lecture du
 * payload (règle projet 11) : `verifierLienGuide` retourne `null` sur toute
 * anomalie et ne lève jamais d'exception.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

// --- Langues ---

/**
 * Langues du guide, alignées sur `LANGUES_PUBLIQUES` (page-publique.ts) :
 * le guide s'adresse aux voyageurs, pas au staff.
 */
export const LANGUES_GUIDE = ["fr", "en", "es", "it", "de", "nl"] as const;
export type LangueGuide = (typeof LANGUES_GUIDE)[number];

export function langueGuideValide(valeur: string): valeur is LangueGuide {
  return (LANGUES_GUIDE as readonly string[]).includes(valeur);
}

// --- Sections ---

export const SECTIONS_GUIDE = [
  "arrivee",
  "wifi",
  "sejour",
  "depart",
  "urgence",
] as const;
export type SectionGuide = (typeof SECTIONS_GUIDE)[number];

/** Ordre d'affichage du guide (arrivée d'abord, urgence en dernier). */
export const ORDRE_SECTIONS_GUIDE: readonly SectionGuide[] = [
  "arrivee",
  "wifi",
  "sejour",
  "depart",
  "urgence",
];

export function sectionGuideValide(valeur: string): valeur is SectionGuide {
  return (SECTIONS_GUIDE as readonly string[]).includes(valeur);
}

// --- Contenu ---

export interface ContenuSectionGuide {
  langue: LangueGuide;
  titre: string;
  corps: string;
}

export interface GuideVoyageur {
  logementId: string;
  langueParDefaut: LangueGuide;
  /** Contenu par section puis par langue ; une section peut manquer. */
  sections: Partial<
    Record<SectionGuide, Partial<Record<LangueGuide, ContenuSectionGuide>>>
  >;
  telUrgence: string | null;
}

const LONGUEUR_MAX_TITRE = 120;
const LONGUEUR_MAX_CORPS = 5000;

/**
 * Valide un contenu de section. Retourne la liste des erreurs (vide si OK).
 * Purement fonctionnel : ne lève jamais.
 */
export function validerContenuSection(contenu: ContenuSectionGuide): string[] {
  const erreurs: string[] = [];
  if (!langueGuideValide(contenu.langue)) {
    erreurs.push(`Langue inconnue : ${contenu.langue}.`);
  }
  if (!contenu.titre.trim()) {
    erreurs.push("Le titre de la section est requis.");
  } else if (contenu.titre.length > LONGUEUR_MAX_TITRE) {
    erreurs.push(
      `Le titre est limité à ${LONGUEUR_MAX_TITRE} caractères.`,
    );
  }
  if (!contenu.corps.trim()) {
    erreurs.push("Le corps de la section est requis.");
  } else if (contenu.corps.length > LONGUEUR_MAX_CORPS) {
    erreurs.push(`Le corps est limité à ${LONGUEUR_MAX_CORPS} caractères.`);
  }
  return erreurs;
}

/**
 * Résout le contenu d'une section pour une langue, avec repli sur la langue
 * par défaut du guide puis sur le français. Retourne `null` si la section
 * n'a aucun contenu.
 */
export function resoudreContenuSection(
  guide: GuideVoyageur,
  section: SectionGuide,
  langue: LangueGuide,
): ContenuSectionGuide | null {
  const parLangue = guide.sections[section];
  if (!parLangue) return null;
  return parLangue[langue] ?? parLangue[guide.langueParDefaut] ?? parLangue.fr ?? null;
}

// --- Lien signé ---

export interface PayloadLienGuide {
  v: 1;
  tenantId: string;
  logementId: string;
  reservationId: string;
  /** Expiration en epoch secondes. */
  exp: number;
}

/** Durée de validité par défaut d'un lien guide. */
export const DUREE_LIEN_GUIDE_JOURS = 60;

function base64url(valeur: string): string {
  return Buffer.from(valeur, "utf8").toString("base64url");
}

function depuisBase64url(valeur: string): string {
  return Buffer.from(valeur, "base64url").toString("utf8");
}

function signer(secret: string, charge: string): string {
  return createHmac("sha256", secret).update(charge).digest("base64url");
}

function egalConstant(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/**
 * Crée un lien guide signé. Lève une erreur si le secret ou un identifiant
 * est vide : un HMAC sans secret ou un lien sans cible serait une faille.
 */
export function creerLienGuide(
  secret: string,
  data: Omit<PayloadLienGuide, "v" | "exp"> & { exp?: number },
  maintenant: number = Date.now(),
): string {
  if (!secret) {
    throw new Error("Le secret de signature du lien guide est requis.");
  }
  if (!data.tenantId || !data.logementId || !data.reservationId) {
    throw new Error("Le lien guide exige tenantId, logementId et reservationId.");
  }
  const exp =
    data.exp ??
    Math.floor(maintenant / 1000) + DUREE_LIEN_GUIDE_JOURS * 24 * 60 * 60;
  const payload: PayloadLienGuide = {
    v: 1,
    tenantId: data.tenantId,
    logementId: data.logementId,
    reservationId: data.reservationId,
    exp,
  };
  const charge = base64url(JSON.stringify(payload));
  return `${charge}.${signer(secret, charge)}`;
}

/**
 * Vérifie la signature HMAC et la structure d'un lien guide AVANT toute
 * utilisation du payload. Retourne `null` si la signature est invalide, la
 * structure corrompue ou le lien expiré. Ne lève jamais.
 */
export function verifierLienGuide(
  secret: string,
  token: string,
  maintenant: number = Date.now(),
): PayloadLienGuide | null {
  if (!secret || !token) return null;
  const [charge, signature, ...reste] = token.split(".");
  if (!charge || !signature || reste.length > 0) return null;
  if (!egalConstant(signature, signer(secret, charge))) return null;

  let payload: Partial<PayloadLienGuide>;
  try {
    payload = JSON.parse(depuisBase64url(charge));
  } catch {
    return null;
  }
  if (
    payload.v !== 1 ||
    typeof payload.tenantId !== "string" ||
    typeof payload.logementId !== "string" ||
    typeof payload.reservationId !== "string" ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }
  if (payload.exp <= Math.floor(maintenant / 1000)) return null;

  return payload as PayloadLienGuide;
}

/**
 * Calcule l'expiration d'un lien guide : au moins `DUREE_LIEN_GUIDE_JOURS`
 * à partir de maintenant, et au moins `joursApresDepart` après la fin du
 * séjour, pour laisser l'accès pendant toute la durée utile.
 */
export function expirationLienGuide(
  finSejour: string,
  joursApresDepart = 30,
  maintenant: number = Date.now(),
): number {
  const fin = Date.parse(`${finSejour}T00:00:00.000Z`);
  const minimum = maintenant + DUREE_LIEN_GUIDE_JOURS * 24 * 60 * 60 * 1000;
  const sejour = fin + joursApresDepart * 24 * 60 * 60 * 1000;
  return Math.floor(Math.max(minimum, sejour) / 1000);
}
