/**
 * US7 (T704) — Authentification des appels API v1.
 *
 * Contrat :
 * - `Authorization: Bearer lcd_…` obligatoire ;
 * - la clé est retrouvée par empreinte SHA-256 (fonction SQL cross-tenant) ;
 * - une clé révoquée ou expirée est refusée (401) ;
 * - un scope absent est refusé (403) ;
 * - rate limit en mémoire par clé (120 requêtes/minute) → 429 ;
 * - chaque appel autorisé est journalisé dans `auditLogs` et marque
 *   `dernier_usage_le` sur la clé ;
 * - `X-Request-Id` est repris s'il est fourni, sinon généré, et renvoyé.
 */
import { randomUUID } from "node:crypto";
import type { ClesApiRepository } from "@/application/ports/api-integrations";
import {
  cleApiUtilisable,
  hacherCleApi,
  scopeAutorise,
  type CleApi,
  type ScopeApi,
} from "@/domain/cle-api";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleClesApiRepository } from "@/infrastructure/db/repositories/cles-api-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import {
  creerRateLimiter,
  type RateLimiter,
} from "@/lib/server/rate-limit";

export const LIMITE_REQUETES_API = 120;
export const FENETRE_API_MS = 60_000;

const limiteurGlobal = creerRateLimiter({
  max: LIMITE_REQUETES_API,
  fenetreMs: FENETRE_API_MS,
});

export interface RequeteApi {
  request: Request;
  url: URL;
  /** Locaux SvelteKit fournis par le routeur (incluent requestId). */
  locals?: { requestId?: string };
}

export interface OptionsAuthApi {
  repo?: ClesApiRepository;
  limiteur?: RateLimiter;
  maintenant?: Date;
  /** Journal injectable (les tests passent un no-op). */
  journaliser?: (
    cle: CleApi,
    requete: RequeteApi,
    scope: ScopeApi,
    requestId: string,
  ) => Promise<void>;
}

export type ResultatAuthApi =
  | {
      ok: true;
      cle: CleApi;
      requestId: string;
      headers: Record<string, string>;
    }
  | { ok: false; reponse: Response };

function enteteJson(headers: Record<string, string> = {}): HeadersInit {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...headers,
  };
}

/** Réponse d'erreur homogène de l'API v1. */
export function erreurApi(
  statut: number,
  code: string,
  message: string,
  requestId?: string,
  headers: Record<string, string> = {},
): Response {
  return new Response(
    JSON.stringify({
      erreur: { code, message },
      ...(requestId ? { requestId } : {}),
    }),
    {
      status: statut,
      headers: enteteJson({
        ...(requestId ? { "x-request-id": requestId } : {}),
        ...headers,
      }),
    },
  );
}

function bearer(entete: string | null): string | null {
  if (!entete) return null;
  const correspondance = /^Bearer\s+(.+)$/i.exec(entete.trim());
  return correspondance?.[1]?.trim() || null;
}

function requestIdDe(requete: RequeteApi): string {
  const depuisLocals = requete.locals?.requestId?.trim() ?? "";
  if (depuisLocals && depuisLocals.length <= 100) return depuisLocals;
  const fourni = requete.request.headers.get("x-request-id")?.trim();
  if (fourni && fourni.length <= 100) return fourni;
  return randomUUID();
}

async function journaliserAudit(
  cle: CleApi,
  requete: RequeteApi,
  scope: ScopeApi,
  requestId: string,
): Promise<void> {
  try {
    await withTenant(cle.tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId: cle.tenantId,
        qui: `api:${cle.prefixe}`,
        action: "api.appel",
        cible: cle.id,
        ref: cle.prefixe,
        payload: {
          methode: requete.request.method,
          chemin: requete.url.pathname,
          scope,
          requestId,
        },
      }),
    );
  } catch (erreur) {
    // Un échec d'audit ne doit pas casser l'appel API : on trace seulement.
    logErreur("api.audit", erreur, { cleId: cle.id });
  }
}

/**
 * Authentifie et autorise un appel API. Ne lève jamais : retourne une réponse
 * prête à renvoyer en cas de refus.
 */
export async function authentifierApi(
  requete: RequeteApi,
  scope: ScopeApi,
  options: OptionsAuthApi = {},
): Promise<ResultatAuthApi> {
  const requestId = requestIdDe(requete);
  const cleClair = bearer(requete.request.headers.get("authorization"));
  if (!cleClair || !cleClair.startsWith("lcd_")) {
    return {
      ok: false,
      reponse: erreurApi(
        401,
        "non_autorise",
        "En-tête Authorization Bearer avec une clé API requis.",
        requestId,
      ),
    };
  }

  const repo = options.repo ?? new DrizzleClesApiRepository();
  const cle = await repo.trouverParHash(hacherCleApi(cleClair));
  if (!cle) {
    return {
      ok: false,
      reponse: erreurApi(401, "non_autorise", "Clé API inconnue.", requestId),
    };
  }
  if (!cleApiUtilisable(cle, options.maintenant)) {
    return {
      ok: false,
      reponse: erreurApi(
        401,
        "cle_invalide",
        "Clé API expirée ou révoquée.",
        requestId,
      ),
    };
  }
  if (!scopeAutorise(cle, scope)) {
    return {
      ok: false,
      reponse: erreurApi(
        403,
        "scope_insuffisant",
        `Scope requis : ${scope}.`,
        requestId,
      ),
    };
  }

  const limiteur = options.limiteur ?? limiteurGlobal;
  if (!limiteur.autoriser(cle.id)) {
    return {
      ok: false,
      reponse: erreurApi(
        429,
        "trop_de_requetes",
        "Limite de 120 requêtes par minute atteinte.",
        requestId,
        { "retry-after": String(Math.ceil(FENETRE_API_MS / 1000)) },
      ),
    };
  }

  // Les effets de bord ne bloquent pas la réponse : la clé reste utilisable
  // même si la trace d'usage échoue.
  try {
    await repo.marquerUsage(cle.tenantId, cle.id);
  } catch (erreur) {
    logErreur("api.usage", erreur, { cleId: cle.id });
  }

  const journaliser = options.journaliser ?? journaliserAudit;
  await journaliser(cle, requete, scope, requestId);

  return {
    ok: true,
    cle,
    requestId,
    headers: {
      "x-request-id": requestId,
      "x-ratelimit-limit": String(LIMITE_REQUETES_API),
      "x-ratelimit-remaining": String(
        Math.max(0, limiteur.restant(cle.id)),
      ),
    },
  };
}
