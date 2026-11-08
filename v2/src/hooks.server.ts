import { building } from "$app/env";
import type { RequestEvent } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth } from "@/lib/server/auth";
import { lireApercu } from "@/lib/server/apercu";
import { demarrerPlanificateurFournisseurs } from "@/lib/server/fournisseur-scheduler";
import { demarrerPlanificateurIcs } from "@/lib/server/ics-scheduler";

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

const entetesSecurite = (chemin: string): Record<string, string> => {
  const entetes: Record<string, string> = {
    "Content-Security-Policy":
      "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=()",
  };
  if (cheminsPrives.some((prefixe) => chemin.startsWith(prefixe))) {
    entetes["X-Robots-Tag"] = "noindex, nofollow, noarchive";
  }
  if (chemin === "/api/widget" || chemin.startsWith("/api/widget/")) {
    // Le widget doit pouvoir être embarqué sur un site externe.
    entetes["Content-Security-Policy"] =
      "base-uri 'self'; form-action 'self'; frame-ancestors *; object-src 'none'";
    delete entetes["X-Frame-Options"];
  }
  return entetes;
};

export const init = async () => {
  demarrerPlanificateurIcs();
  demarrerPlanificateurFournisseurs();
};

export const handle = async ({
  event,
  resolve,
}: {
  event: RequestEvent;
  resolve: (event: RequestEvent) => Response | Promise<Response>;
}): Promise<Response> => {
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

  const reponse = await svelteKitHandler({ auth, event, resolve, building });
  const entetes = new Headers(reponse.headers);
  for (const [cle, valeur] of Object.entries(entetesSecurite(event.url.pathname))) {
    entetes.set(cle, valeur);
  }
  return new Response(reponse.body, {
    status: reponse.status,
    statusText: reponse.statusText,
    headers: entetes,
  });
};
