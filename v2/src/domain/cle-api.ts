/**
 * US7 (T700) — Domaine des clés API.
 *
 * Une clé est générée en clair **une seule fois** puis seule son empreinte
 * SHA-256 est persistée. Le préfixe (`lcd_` + 8 caractères) sert uniquement à
 * l'affichage staff : il ne permet pas de reconstituer le secret.
 *
 * Le domaine reste pur : `node:crypto` est autorisé, aucun accès base ni HTTP.
 */
import { createHash, randomBytes } from "node:crypto";
import { ErreurMetier } from "./erreurs";

/** Scopes exposés par l'API v1, alignés sur les ressources documentées. */
export const SCOPES_API = [
  "logements:lire",
  "reservations:lire",
  "disponibilites:lire",
  "prix:lire",
  "proprietaires:lire",
  "releves:lire",
] as const;

export type ScopeApi = (typeof SCOPES_API)[number];

/** Libellés staff des scopes (UI `/hote/integrations/api`). */
export const LIBELLES_SCOPE_API: Record<ScopeApi, string> = {
  "logements:lire": "Logements",
  "reservations:lire": "Réservations",
  "disponibilites:lire": "Disponibilités",
  "prix:lire": "Prix",
  "proprietaires:lire": "Propriétaires",
  "releves:lire": "Relevés propriétaires",
};

export const PREFIXE_CLE_API = "lcd_";
export const LONGUEUR_SECRET_OCTETS = 32;
export const NOM_CLE_MIN = 2;
export const NOM_CLE_MAX = 80;

export interface CleApi {
  id: string;
  tenantId: string;
  nom: string;
  /** `lcd_` + 8 caractères, non secret, affiché dans l'UI. */
  prefixe: string;
  /** SHA-256 hexadécimal de la clé complète. */
  hash: string;
  scopes: ScopeApi[];
  expireLe: string | null;
  creeLe: string;
  dernierUsageLe: string | null;
  revoqueLe: string | null;
}

export interface CleApiGeneree {
  /** Clé en clair : à afficher une seule fois, jamais persistée. */
  cle: string;
  prefixe: string;
  hash: string;
}

export function hacherCleApi(cle: string): string {
  return createHash("sha256").update(cle, "utf8").digest("hex");
}

export function prefixeCleApi(cle: string): string {
  return cle.slice(0, PREFIXE_CLE_API.length + 8);
}

/** Génère 32 octets aléatoires et retourne la clé, son préfixe et son hash. */
export function genererCleApi(): CleApiGeneree {
  const secret = randomBytes(LONGUEUR_SECRET_OCTETS).toString("base64url");
  const cle = `${PREFIXE_CLE_API}${secret}`;
  return { cle, prefixe: prefixeCleApi(cle), hash: hacherCleApi(cle) };
}

export function nomCleValide(nom: string): boolean {
  const valeur = nom.trim();
  return valeur.length >= NOM_CLE_MIN && valeur.length <= NOM_CLE_MAX;
}

/**
 * Normalise et valide les scopes : doublons supprimés, ordre conservé, scope
 * inconnu refusé. Un scope absent est refusé : une clé sans droit n'a pas de
 * sens.
 */
export function normaliserScopes(scopes: readonly string[]): ScopeApi[] {
  const uniques = [...new Set(scopes.map((scope) => scope.trim()))].filter(
    Boolean,
  );
  if (uniques.length === 0) {
    throw new ErreurMetier(
      "CLE_API_INVALIDE",
      "Sélectionnez au moins un scope pour la clé API.",
    );
  }
  const inconnus = uniques.filter(
    (scope) => !(SCOPES_API as readonly string[]).includes(scope),
  );
  if (inconnus.length > 0) {
    throw new ErreurMetier(
      "CLE_API_INVALIDE",
      `Scope API inconnu : ${inconnus.join(", ")}.`,
    );
  }
  return uniques as ScopeApi[];
}

/** Vrai si la clé n'est ni révoquée ni expirée à l'instant donné. */
export function cleApiUtilisable(cle: CleApi, maintenant = new Date()): boolean {
  if (cle.revoqueLe) return false;
  if (!cle.expireLe) return true;
  const expiration = new Date(cle.expireLe);
  return !Number.isNaN(expiration.getTime()) && expiration > maintenant;
}

/** Vrai si la clé est utilisable **et** porte le scope demandé. */
export function scopeAutorise(cle: CleApi, scope: ScopeApi): boolean {
  return cleApiUtilisable(cle) && cle.scopes.includes(scope);
}

/**
 * Crée l'entité et la clé en clair. L'identifiant et l'horloge sont injectés
 * par l'appelant (route/use case) pour rester déterministe en test.
 */
export function creerCleApi(input: {
  id: string;
  tenantId: string;
  nom: string;
  scopes: readonly string[];
  expireLe?: string | null;
  maintenant?: string;
}): { cle: string; entite: CleApi } {
  const nom = input.nom.trim();
  if (!nomCleValide(nom)) {
    throw new ErreurMetier(
      "CLE_API_INVALIDE",
      `Le nom de la clé doit contenir de ${NOM_CLE_MIN} à ${NOM_CLE_MAX} caractères.`,
    );
  }
  const scopes = normaliserScopes(input.scopes);
  const maintenant = input.maintenant ?? new Date().toISOString();

  let expireLe: string | null = null;
  if (input.expireLe) {
    const expiration = new Date(input.expireLe);
    if (Number.isNaN(expiration.getTime())) {
      throw new ErreurMetier("CLE_API_INVALIDE", "Date d'expiration invalide.");
    }
    if (expiration.getTime() <= new Date(maintenant).getTime()) {
      throw new ErreurMetier(
        "CLE_API_INVALIDE",
        "La date d'expiration doit être dans le futur.",
      );
    }
    expireLe = expiration.toISOString();
  }

  const generee = genererCleApi();
  return {
    cle: generee.cle,
    entite: {
      id: input.id,
      tenantId: input.tenantId,
      nom,
      prefixe: generee.prefixe,
      hash: generee.hash,
      scopes,
      expireLe,
      creeLe: maintenant,
      dernierUsageLe: null,
      revoqueLe: null,
    },
  };
}

/**
 * Révocation idempotente : une clé déjà révoquée est retournée inchangée.
 * La date de première révocation est conservée.
 */
export function revoquerCleApi(
  cle: CleApi,
  options: { maintenant?: string } = {},
): CleApi {
  if (cle.revoqueLe) return cle;
  return {
    ...cle,
    revoqueLe: options.maintenant ?? new Date().toISOString(),
  };
}
