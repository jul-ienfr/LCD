import { building } from "$app/env";
import type { RequestEvent } from "@sveltejs/kit";
import type { Handle, HandleServerError } from "@sveltejs/kit/hooks";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth } from "@/lib/server/auth";
import { lireApercu } from "@/lib/server/apercu";
import {
  doitValiderEnProduction,
  resumeConstats,
  validerEnvironnementProduction,
} from "@/lib/server/env-production";
import { demarrerPlanificateurFournisseurs } from "@/lib/server/fournisseur-scheduler";
import { demarrerPlanificateurIcs } from "@/lib/server/ics-scheduler";
import { brancherPersistanceJournaux } from "@/lib/server/journaux";
import { demarrerPlanificateurExploitation } from "@/lib/server/planificateur-exploitation";
import { genererRequestId } from "@/lib/server/logger";
import { logErreur } from "@/lib/logger";
import { COOKIE_LANGUE, langueRequete } from "@/lib/server/langue";
import { cachePublic, enteteCacheHtml } from "@/lib/server/cache-http";
import {
  corpsErreurApi,
  doitNormaliserErreurApi,
  entetesErreurApi,
} from "@/lib/server/api-erreurs";
import { tenantEnLectureSeule } from "@/lib/server/lecture-seule";
import { doitBloquerEcriture } from "@/domain/lecture-seule";
import { doitSuspendreMaintenance } from "@/domain/maintenance";
import { lireMaintenance } from "@/lib/server/maintenance";
import { pageMaintenance } from "@/lib/server/page-maintenance";
import { apparencePourRequete } from "@/lib/server/apparence";
import { estSuperAdmin } from "@/lib/server/session";

const estRessource = (chemin: string): boolean =>
  chemin.startsWith("/_app/") ||
  chemin === "/favicon.svg" ||
  chemin === "/robots.txt";

const cheminsPrives = [
  "/hote",
  "/hote/",
  "/login",
  "/two-factor",
  "/presta",
  "/presta/",
  "/proprio",
  "/proprio/",
  "/commercial",
  "/commercial/",
  "/support",
  "/support/",
  "/facture/",
  "/voyageur",
  "/voyageur/",
  "/api/",
];

/**
 * Le CSP des pages est posé par SvelteKit (`csp` dans `vite.config.ts`), avec
 * un nonce pour les scripts inline. On ne le réécrit pas ici, sous peine de
 * supprimer ce nonce. Seul le widget, qui doit être embarquable, a sa propre
 * politique.
 */
const entetesSecurite = (chemin: string): Record<string, string> => {
  const entetes: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=()",
  };
  if (cheminsPrives.some((prefixe) => chemin.startsWith(prefixe))) {
    entetes["X-Robots-Tag"] = "noindex, nofollow, noarchive";
  }
  return entetes;
};

const cheminWidget = (chemin: string): boolean =>
  chemin === "/api/widget" || chemin.startsWith("/api/widget/");

export const init = async () => {
  // Un déploiement réel (production + HTTPS) refuse de démarrer sur un secret
  // de développement, une URL non sécurisée ou un stockage non persistant.
  if (doitValiderEnProduction(process.env)) {
    const constats = validerEnvironnementProduction(process.env);
    const erreurs = constats.filter((constat) => constat.niveau === "erreur");
    if (erreurs.length > 0) {
      throw new Error(
        `Environnement de production invalide :\n${resumeConstats(constats)}`,
      );
    }
    for (const constat of constats) {
      if (constat.niveau === "avertissement") {
        console.warn(`[env] ${constat.variable} : ${constat.message}`);
      }
    }
  }
  // FR-016 : les lignes de journal sont persistées (best-effort) avant le
  // démarrage des planificateurs — leurs lignes de démarrage doivent déjà
  // être consultables depuis la supervision.
  brancherPersistanceJournaux();
  demarrerPlanificateurIcs();
  demarrerPlanificateurFournisseurs();
  demarrerPlanificateurExploitation();
};

export const handle: Handle = async ({ event, resolve }) => {
  // Identifiant de requête (FR-021) : posé sur chaque requête serveur,
  // renvoyé en en-tête, journalisé avec chaque erreur et affiché sur la
  // page d'erreur. Un client peut le citer pour retrouver l'incident.
  const requestId =
    event.request.headers.get("x-request-id")?.slice(0, 64) ||
    genererRequestId();
  event.locals.requestId = requestId;

  if (!building && !estRessource(event.url.pathname)) {
    const session = await auth.api.getSession({
      headers: event.request.headers,
    });
    event.locals.session = session as App.Locals["session"];
  }

  // FR-017 : mode maintenance global. La suspension précède tout routage :
  // le super-admin (et les sondes, crons, webhooks, la connexion) restent
  // joignables pour constater, corriger et rouvrir sans redéploiement.
  if (!building && !estRessource(event.url.pathname)) {
    const etatMaintenance = await lireMaintenance();
    if (
      doitSuspendreMaintenance({
        chemin: event.url.pathname,
        actif: etatMaintenance.actif,
        superAdmin: estSuperAdmin(event.locals.session),
      })
    ) {
      // Les clients machine (API partenaires) reçoivent un 503 JSON, pas une
      // page HTML : le code et le corps disent la même chose.
      if (event.url.pathname.startsWith("/api/")) {
        return new Response(
          JSON.stringify({
            error: {
              code: "MAINTENANCE",
              message:
                etatMaintenance.message ??
                "Le service est en maintenance ; réessayez dans quelques minutes.",
            },
          }),
          {
            status: 503,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "retry-after": "120",
              "cache-control": "no-store",
              "x-request-id": requestId,
            },
          },
        );
      }
      const { apparence } = await apparencePourRequete(event);
      return new Response(
        pageMaintenance({
          etat: etatMaintenance,
          apparence,
          langue: langueRequete(event),
          requestId,
        }),
        {
          status: 503,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "retry-after": "120",
            "cache-control": "no-store",
            "x-request-id": requestId,
            ...entetesSecurite(event.url.pathname),
          },
        },
      );
    }
  }

  if (
    event.locals.session &&
    event.request.method !== "GET" &&
    !event.url.pathname.startsWith("/preview/") &&
    !event.url.pathname.startsWith("/api/auth/")
  ) {
    const apercu = lireApercu(event, event.locals.session);
    if (apercu) {
      return new Response(null, {
        status: 303,
        headers: { location: "/preview/lecture-seule" },
      });
    }
  }

  if (event.locals.session) {
    const bloque = doitBloquerEcriture({
      methode: event.request.method,
      chemin: event.url.pathname,
      lectureSeule: await tenantEnLectureSeule(
        event.locals.session.user.tenantId,
      ),
    });
    if (bloque) {
      if (event.url.pathname.startsWith("/api/")) {
        return new Response(
          JSON.stringify({
            error: {
              code: "LECTURE_SEULE",
              message:
                "Ce tenant de démonstration est en lecture seule : aucune écriture n'est autorisée.",
            },
          }),
          {
            status: 403,
            headers: { "content-type": "application/json; charset=utf-8" },
          },
        );
      }
      return new Response(null, {
        status: 303,
        headers: { location: "/hote?lectureSeule=1" },
      });
    }
  }

  const resolveAvecLangue = (requestEvent: RequestEvent) =>
    resolve(requestEvent, {
      transformPageChunk: ({ html }) =>
        html.replace(
          '<html lang="fr"',
          `<html lang="${langueRequete(requestEvent)}"`,
        ),
    });

  const reponse = await svelteKitHandler({
    auth,
    event,
    resolve: resolveAvecLangue,
    building,
  });
  const entetes = new Headers(reponse.headers);
  for (const [cle, valeur] of Object.entries(entetesSecurite(event.url.pathname))) {
    entetes.set(cle, valeur);
  }
  // L'identifiant de requête suit la réponse : support, journaux, traces.
  entetes.set("x-request-id", requestId);
  // FR-029 : une erreur serveur d'API part toujours en JSON, jamais en page
  // HTML ; `handleError` l'a déjà journalisée avec l'identifiant de requête.
  const normaliserErreurApi = doitNormaliserErreurApi({
    chemin: event.url.pathname,
    statut: reponse.status,
    contentType: reponse.headers.get("content-type"),
  });
  if (normaliserErreurApi) {
    for (const [cle, valeur] of Object.entries(entetesErreurApi(requestId))) {
      entetes.set(cle, valeur);
    }
    // Le corps HTML est remplacé : sa longueur et son empreinte ne valent plus.
    entetes.delete("content-length");
    entetes.delete("etag");
  } else {
    // FR-028 : cache public réservé aux pages vitrine anonymes ; toute réponse
    // personnalisée (session, cookie de langue, écriture de cookie) est
    // `private, no-store`. Une route qui a déjà posé son cache garde la main.
    const cacheControl = enteteCacheHtml({
      chemin: event.url.pathname,
      methode: event.request.method,
      statut: reponse.status,
      contentType: reponse.headers.get("content-type"),
      aSession: Boolean(event.locals.session),
      aCookieLangue: Boolean(event.cookies.get(COOKIE_LANGUE)),
      aSetCookie: reponse.headers.has("set-cookie"),
      cacheControlExistant: reponse.headers.get("cache-control"),
    });
    if (cacheControl) {
      entetes.set("Cache-Control", cacheControl);
      if (cachePublic(cacheControl)) entetes.set("Vary", "Cookie");
    }
  }
  if (cheminWidget(event.url.pathname)) {
    // Le widget doit pouvoir être embarqué sur un site externe.
    entetes.set(
      "Content-Security-Policy",
      "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; form-action 'self'; base-uri 'self'; object-src 'none'; frame-ancestors *",
    );
    entetes.delete("X-Frame-Options");
  }
  return new Response(
    normaliserErreurApi ? corpsErreurApi(requestId) : reponse.body,
    {
      status: reponse.status,
      statusText: reponse.statusText,
      headers: entetes,
    },
  );
};

/**
 * Erreurs de page (FR-020) : toute erreur inattendue est journalisée avec
 * l'identifiant de requête (stdout, et table `journaux_applicatifs` via
 * FR-016), capturée par Sentry si configuré, et la page d'erreur reçoit un
 * message court + l'identifiant — jamais une trace.
 */
export const handleError: HandleServerError = ({ kind, error, event }) => {
  const requestId = event.locals.requestId ?? genererRequestId();
  const statut =
    kind === "framework" || kind === "validation"
      ? (error as { status: number }).status
      : kind === "app"
        ? ((error as { status?: number }).status ?? 500)
        : 500;
  const contexte = {
    requestId,
    chemin: event.url.pathname,
    methode: event.request.method,
    statut,
  };
  if (kind === "unknown" || statut >= 500) {
    logErreur("erreur.page", error, contexte);
  }
  if (kind === "app" || kind === "framework") {
    return { ...(error as Record<string, unknown>), requestId };
  }
  return {
    status: 500,
    message: "Une erreur inattendue est survenue. Elle a été enregistrée.",
    requestId,
  };
};
