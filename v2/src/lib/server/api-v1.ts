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
import { erreurApi } from "./api-auth";

export interface ParametresPagination {
  page: number;
  limite: number;
  offset: number;
}

function entier(valeur: string | null, defaut: number): number {
  const nombre = Number.parseInt(valeur ?? "", 10);
  return Number.isFinite(nombre) ? nombre : defaut;
}

export function parametresPagination(url: URL): ParametresPagination {
  const page = Math.max(1, entier(url.searchParams.get("page"), 1));
  const limite = Math.min(
    200,
    Math.max(1, entier(url.searchParams.get("limite"), 50)),
  );
  return { page, limite, offset: (page - 1) * limite };
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

export function erreurInterne(
  requestId: string,
  headers: Record<string, string>,
): Response {
  return erreurApi(
    500,
    "erreur_interne",
    "Erreur interne pendant le traitement de la requête.",
    requestId,
    headers,
  );
}
