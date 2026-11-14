/**
 * T209 — routage d'un domaine personnalisé vers le site public du tenant.
 *
 * Fonctions pures partagées par le hook `reroute` et ses tests. Le domaine
 * activé sert le site à la racine ; les routes applicatives (réservation,
 * guide, staff, API) restent accessibles sur le même domaine et ne sont pas
 * réécrites.
 */

const ROUTES_APPLICATION = [
  "/api",
  "/_app",
  "/site",
  "/reserver",
  "/guide",
  "/voyageur",
  "/contrat",
  "/facture",
  "/login",
  "/logout",
  "/two-factor",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
  "/hote",
  "/presta",
  "/proprio",
  "/commercial",
  "/support",
  "/supervision",
  "/systeme",
  "/developpeurs",
  "/legales",
  "/aide",
  "/consentement",
  "/preview",
  "/sitemap",
  "/robots.txt",
  "/favicon.svg",
  "/widget",
];

const HOTES_LOCAUX = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function hoteNormalise(hote: string): string {
  return hote
    .trim()
    .toLowerCase()
    .replace(/:\d+$/u, "")
    .replace(/^\[|\]$/gu, "");
}

export function estHoteLocal(hote: string): boolean {
  return HOTES_LOCAUX.has(hoteNormalise(hote));
}

export function estRouteApplication(chemin: string): boolean {
  return ROUTES_APPLICATION.some(
    (prefixe) => chemin === prefixe || chemin.startsWith(`${prefixe}/`),
  );
}

/**
 * Chemin public à servir pour un domaine personnalisé. `null` signifie :
 * laisser la route demandée telle quelle (API, réservation, staff…).
 */
export function cheminSitePourDomaine(
  chemin: string,
  slug: string,
): string | null {
  if (!chemin.startsWith("/")) return null;
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u.test(slug)) return null;
  if (estRouteApplication(chemin)) return null;
  return chemin === "/" ? `/site/${slug}` : `/site/${slug}${chemin}`;
}
