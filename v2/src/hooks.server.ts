import { building } from "$app/env";
import type { RequestEvent } from "@sveltejs/kit";
import type { Handle } from "@sveltejs/kit/hooks";
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
import { langueRequete } from "@/lib/server/langue";
import { tenantEnLectureSeule } from "@/lib/server/lecture-seule";
import { doitBloquerEcriture } from "@/domain/lecture-seule";

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
  demarrerPlanificateurIcs();
  demarrerPlanificateurFournisseurs();
};

export const handle: Handle = async ({ event, resolve }) => {
  if (!building && !estRessource(event.url.pathname)) {
    const session = await auth.api.getSession({
      headers: event.request.headers,
    });
    event.locals.session = session as App.Locals["session"];
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
  if (cheminWidget(event.url.pathname)) {
    // Le widget doit pouvoir être embarqué sur un site externe.
    entetes.set(
      "Content-Security-Policy",
      "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; form-action 'self'; base-uri 'self'; object-src 'none'; frame-ancestors *",
    );
    entetes.delete("X-Frame-Options");
  }
  return new Response(reponse.body, {
    status: reponse.status,
    statusText: reponse.statusText,
    headers: entetes,
  });
};
