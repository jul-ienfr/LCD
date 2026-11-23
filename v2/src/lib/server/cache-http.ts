/**
 * En-têtes de cache des pages HTML servies en SSR (spec 006, FR-028).
 *
 * Principe : seul un contenu public, anonyme et non personnalisé est mis en
 * cache partagé. Dès qu'une requête porte une session, un cookie de langue ou
 * une écriture de cookie, la réponse devient `private, no-store` : jamais de
 * contenu de session derrière un cache partagé (proxy, CDN, service worker
 * d'un autre utilisateur).
 *
 * Les réponses non-HTML (API, assets) ne sont pas touchées, et un en-tête
 * `Cache-Control` déjà posé par la route est respecté tel quel.
 */

export interface PagePubliqueCacheable {
  /** Chemin exact, ou préfixe si `prefixe` vaut true. */
  chemin: string;
  prefixe?: boolean;
  /** `max-age` navigateur, en secondes. */
  maxAge: number;
  /** `s-maxage` cache partagé (proxy/CDN), en secondes. */
  sMaxAge: number;
}

/**
 * Surfaces publiques : contenu vitrine ou documentaire, identique pour tous
 * les visiteurs anonymes. Les pages signées (jetons), les espaces staff,
 * voyageur et prestataire, et le tunnel de réservation en sont volontairement
 * exclus.
 */
export const PAGES_PUBLIQUES_CACHEABLES: readonly PagePubliqueCacheable[] = [
  // Accueil et sites publiés : prix et disponibilités peuvent bouger.
  { chemin: "/", maxAge: 60, sMaxAge: 300 },
  { chemin: "/site/", prefixe: true, maxAge: 60, sMaxAge: 300 },
  // Contenu documentaire : change rarement, tolère un cache plus long.
  { chemin: "/aide", maxAge: 300, sMaxAge: 3600 },
  { chemin: "/legales", maxAge: 300, sMaxAge: 3600 },
  { chemin: "/design", maxAge: 300, sMaxAge: 3600 },
  { chemin: "/developpeurs", maxAge: 300, sMaxAge: 3600 },
  { chemin: "/tarifs", maxAge: 300, sMaxAge: 3600 },
];

const SECONDE_JOUR = 86_400;

export function pagePubliqueCacheable(
  chemin: string,
): PagePubliqueCacheable | null {
  for (const page of PAGES_PUBLIQUES_CACHEABLES) {
    if (page.prefixe) {
      const racine = page.chemin.replace(/\/+$/u, "");
      if (chemin === racine || chemin.startsWith(`${racine}/`)) return page;
    } else if (chemin === page.chemin) {
      return page;
    }
  }
  return null;
}

export interface ContexteCacheHtml {
  chemin: string;
  methode: string;
  statut: number;
  /** `Content-Type` de la réponse, tel qu'émis. */
  contentType: string | null;
  /** Une session est attachée à la requête. */
  aSession: boolean;
  /** La requête porte le cookie de langue (rendu personnalisé). */
  aCookieLangue: boolean;
  /** La réponse écrit un cookie (session, panier, jetons). */
  aSetCookie: boolean;
  /** La route a déjà décidé de son cache. */
  cacheControlExistant: string | null;
}

/**
 * Valeur de `Cache-Control` à appliquer, ou `null` pour laisser la réponse
 * inchangée (non-HTML, ou en-tête déjà posé par la route).
 */
export function enteteCacheHtml(contexte: ContexteCacheHtml): string | null {
  const estHtml = (contexte.contentType ?? "")
    .toLowerCase()
    .includes("text/html");
  if (!estHtml) return null;
  if (contexte.cacheControlExistant) return null;

  const personnalise =
    contexte.aSession || contexte.aSetCookie || contexte.aCookieLangue;
  // Une réponse personnalisée, non-GET ou non-200 ne doit jamais atterrir
  // dans un cache partagé.
  if (personnalise || contexte.methode !== "GET" || contexte.statut !== 200) {
    return "private, no-store";
  }

  const page = pagePubliqueCacheable(contexte.chemin);
  if (!page) return "private, no-store";

  return (
    `public, max-age=${page.maxAge}, s-maxage=${page.sMaxAge}, ` +
    `stale-while-revalidate=${SECONDE_JOUR}`
  );
}

/**
 * Un cache partagé ne doit pas servir une page publique à un visiteur porteur
 * d'un cookie de langue : la variante dépend du cookie.
 */
export function cachePublic(cacheControl: string | null): boolean {
  return cacheControl !== null && cacheControl.startsWith("public");
}
