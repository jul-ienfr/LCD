/**
 * US7 (T705/T706) — Helpers de réponse de l'API v1.
 *
 * Format stable :
 *   { data, pagination: { page, limite, total, pages } }
 *   { data }                        pour un objet
 *   { erreur: { code, message }, requestId }
 *
 * `page` commence à 1, `limite` est bornée à 200 (défaut 50).
 */
import { bornerPage, nombreDePages } from "@/domain/pagination";
import { logErreur } from "@/lib/logger";
import { erreurApi } from "./api-auth";

export interface ParametresPagination {
  page: number;
  limite: number;
  offset: number;
}

export function parametresPagination(url: URL): ParametresPagination {
  // FR-026 : une seule source de bornes (`bornerPage`), partagée avec les
  // écrans — jamais de `limit`/`offset` fabriqués à la main.
  const bornee = bornerPage(
    Number.parseInt(url.searchParams.get("page") ?? "", 10),
    Number.parseInt(url.searchParams.get("limite") ?? "", 10),
  );
  return { page: bornee.page, limite: bornee.taille, offset: bornee.decalage };
}

function entetesJson(
  requestId: string,
  headers: Record<string, string>,
): Record<string, string> {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-request-id": requestId,
    ...headers,
  };
}

export function reponseListe<T>(
  url: URL,
  lignes: readonly T[],
  requestId: string,
  headers: Record<string, string>,
): Response {
  const { page, limite, offset } = parametresPagination(url);
  const total = lignes.length;
  return new Response(
    JSON.stringify({
      data: lignes.slice(offset, offset + limite),
      pagination: {
        page,
        limite,
        total,
        pages: Math.max(1, Math.ceil(total / limite)),
      },
    }),
    { status: 200, headers: entetesJson(requestId, headers) },
  );
}

/**
 * Réponse d'une liste déjà paginée côté SQL (FR-026) : `total` vient du
 * compteur SQL et les lignes reçues sont la page demandée — aucun découpage
 * en mémoire.
 */
export function reponseListePaginee<T>(
  url: URL,
  lignes: readonly T[],
  total: number,
  requestId: string,
  headers: Record<string, string>,
): Response {
  const { page, limite } = parametresPagination(url);
  return new Response(
    JSON.stringify({
      data: lignes,
      pagination: {
        page,
        limite,
        total,
        pages: nombreDePages(total, limite),
      },
    }),
    { status: 200, headers: entetesJson(requestId, headers) },
  );
}

export function reponseObjet<T>(
  data: T,
  requestId: string,
  headers: Record<string, string>,
): Response {
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: entetesJson(requestId, headers),
  });
}

/** Valide un paramètre de date `AAAA-MM-JJ` ; retourne une erreur 400 sinon. */
export function dateRequise(
  url: URL,
  nom: string,
  requestId: string,
  headers: Record<string, string>,
  valide: (date: string) => boolean,
): string | Response {
  const valeur = url.searchParams.get(nom)?.trim() ?? "";
  if (!valeur || !valide(valeur)) {
    return erreurApi(
      400,
      "parametre_invalide",
      `Paramètre « ${nom} » requis au format AAAA-MM-JJ.`,
      requestId,
      headers,
    );
  }
  return valeur;
}

export function parametreRequis(
  url: URL,
  nom: string,
  requestId: string,
  headers: Record<string, string>,
  maxLongueur = 100,
): string | Response {
  const valeur = url.searchParams.get(nom)?.trim() ?? "";
  if (!valeur || valeur.length > maxLongueur) {
    return erreurApi(
      400,
      "parametre_invalide",
      `Paramètre « ${nom} » requis.`,
      requestId,
      headers,
    );
  }
  return valeur;
}

/**
 * Réponse 500 de l'API v1 (FR-029) : aucun 500 ne part sans être journalisé.
 * L'erreur d'origine est tracée avec l'identifiant de requête ; le client ne
 * reçoit qu'un message générique.
 */
export function erreurInterne(
  requestId: string,
  headers: Record<string, string>,
  erreur?: unknown,
): Response {
  logErreur("apiV1.erreurInterne", erreur ?? new Error("Erreur interne."), {
    requestId,
  });
  return erreurApi(
    500,
    "erreur_interne",
    "Erreur interne pendant le traitement de la requête.",
    requestId,
    headers,
  );
}
