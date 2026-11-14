import { createHash, randomUUID } from "node:crypto";
import type { RequestEvent } from "@sveltejs/kit";
import type { SuiviRepository } from "@/application/ports/suivi";
import { DrizzleSuiviRepository } from "@/infrastructure/db/repositories/suivi-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import {
  configurationSuiviActive,
  configurationSuiviVide,
  CONSENTEMENT_COOKIE,
  CONSENTEMENT_DUREE_JOURS,
  VISITEUR_COOKIE,
  VISITEUR_DUREE_JOURS,
  campagneDepuisParametres,
  lireConsentement,
  normaliserEvenementSuivi,
  serialiserConsentement,
  type ConfigurationSuivi,
  type Consentement,
  type EvenementSuivi,
} from "@/domain/suivi";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";

const SESSION_COOKIE = "lcd_suivi_session";
const SESSION_DUREE_SECONDES = 30 * 60;

export interface SuiviPublic {
  actif: boolean;
  tenantSlug: string;
  mesure: ConfigurationSuivi["mesure"];
  publicite: ConfigurationSuivi["publicite"];
  consentement: Consentement;
  visiteurId: string;
  sessionId: string;
  scriptsMesure: string[];
  scriptsPublicite: string[];
  scriptsClient: string[];
}

export function lireConsentementRequete(
  event: Pick<RequestEvent, "cookies">,
): Consentement | null {
  return lireConsentement(event.cookies.get(CONSENTEMENT_COOKIE));
}

export async function suiviActifPourTenant(tenantId: string): Promise<boolean> {
  try {
    const configuration =
      await new DrizzleSuiviRepository().lireConfiguration(tenantId);
    return configuration !== null && configurationSuiviActive(configuration);
  } catch (error) {
    logErreur("suivi.configuration", error, { tenantId });
    return false;
  }
}

export function poserConsentement(
  event: Pick<RequestEvent, "cookies" | "url">,
  consentement: Consentement,
): void {
  event.cookies.set(CONSENTEMENT_COOKIE, serialiserConsentement(consentement), {
    path: "/",
    maxAge: 60 * 60 * 24 * CONSENTEMENT_DUREE_JOURS,
    sameSite: "lax",
    httpOnly: false,
    secure: event.url.protocol === "https:",
  });
  // L'ancien bandeau « J'ai compris » ne doit plus masquer le choix.
  event.cookies.set("lcd_cookies_ok", "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false,
    secure: event.url.protocol === "https:",
  });
}

function identifiantsSuivi(
  event: Pick<RequestEvent, "cookies" | "url">,
  consentement: Consentement,
): { visiteurId: string; sessionId: string } {
  if (!consentement.mesure && !consentement.publicite) {
    return { visiteurId: "", sessionId: "" };
  }
  let visiteurId = event.cookies.get(VISITEUR_COOKIE);
  if (!visiteurId || !/^[0-9a-f-]{36}$/i.test(visiteurId)) {
    visiteurId = randomUUID();
    event.cookies.set(VISITEUR_COOKIE, visiteurId, {
      path: "/",
      maxAge: 60 * 60 * 24 * VISITEUR_DUREE_JOURS,
      sameSite: "lax",
      httpOnly: true,
      secure: event.url.protocol === "https:",
    });
  }
  let sessionId = event.cookies.get(SESSION_COOKIE);
  if (!sessionId || !/^[0-9a-f-]{36}$/i.test(sessionId)) {
    sessionId = randomUUID();
  }
  event.cookies.set(SESSION_COOKIE, sessionId, {
    path: "/",
    maxAge: SESSION_DUREE_SECONDES,
    sameSite: "lax",
    httpOnly: true,
    secure: event.url.protocol === "https:",
  });
  return { visiteurId, sessionId };
}

export function empreinteIp(event: Pick<RequestEvent, "request" | "getClientAddress">): string {
  const transmise = event.request.headers.get("x-forwarded-for")?.split(",")[0];
  const ip = transmise?.trim() || event.getClientAddress();
  const secret =
    env.SUIVI_HASH_SECRET?.trim() ||
    env.BETTER_AUTH_SECRET ||
    "lcd-suivi-developpement";
  return createHash("sha256").update(`${secret}|${ip}`).digest("hex");
}

function texteCourt(valeur: string | null, max: number): string | null {
  const propre = valeur?.trim();
  return propre ? propre.slice(0, max) : null;
}

export async function enregistrerEvenementSuivi(
  event: RequestEvent,
  tenantId: string,
  consentement: Consentement,
  entree: unknown,
  options: {
    repository?: SuiviRepository;
    consentementRequis?: "mesure" | "publicite";
  } = {},
): Promise<void> {
  if (!consentement.mesure) return;
  if (options.consentementRequis === "publicite" && !consentement.publicite) {
    return;
  }
  let evenement: EvenementSuivi;
  try {
    evenement = normaliserEvenementSuivi(entree, {
      pageParDefaut: event.url.pathname,
    });
  } catch (error) {
    logErreur("suivi.evenementInvalide", error, { tenantId });
    return;
  }
  const { visiteurId, sessionId } = identifiantsSuivi(event, consentement);
  if (!visiteurId || !sessionId) return;
  const repository = options.repository ?? new DrizzleSuiviRepository();
  try {
    await repository.enregistrerEvenement({
      tenantId,
      visiteurId,
      sessionId,
      evenement,
      consentement,
      ipHash: empreinteIp(event),
      userAgent: texteCourt(event.request.headers.get("user-agent"), 300),
    });
  } catch (error) {
    logErreur("suivi.enregistrement", error, { tenantId });
  }
}

/**
 * Résout le suivi public d'un site tenant. Ne s'active que sur `/site/<slug>`
 * (jamais sur l'espace hôte, voyageur ou les aperçus).
 */
export async function suiviPourRequete(
  event: RequestEvent,
): Promise<SuiviPublic | null> {
  const correspondanceSite = /^\/site\/([^/]+)/.exec(event.url.pathname);
  let slug: string | null = null;
  if (correspondanceSite) {
    try {
      slug = decodeURIComponent(correspondanceSite[1]!);
    } catch {
      return null;
    }
  } else if (
    event.url.pathname === "/reserver" ||
    event.url.pathname.startsWith("/reserver/")
  ) {
    slug = event.url.searchParams.get("tenant")?.trim() || "lcd";
  }
  if (!slug) return null;
  const tenant = await new DrizzleTenantRepository().trouverParSlug(slug);
  if (!tenant) return null;
  const configuration =
    (await new DrizzleSuiviRepository().lireConfiguration(tenant.id)) ??
    configurationSuiviVide();
  if (!configurationSuiviActive(configuration)) return null;
  const consentement = lireConsentementRequete(event) ?? {
    version: "2026-11",
    mesure: false,
    publicite: false,
  };
  const { visiteurId, sessionId } = identifiantsSuivi(event, consentement);
  const userAgent = event.request.headers.get("user-agent");
  if (
    consentement.mesure &&
    visiteurId &&
    sessionId &&
    !/bot|crawl|spider|slurp|bingpreview|facebookexternalhit/i.test(
      userAgent ?? "",
    )
  ) {
    void enregistrerEvenementSuivi(
      event,
      tenant.id,
      consentement,
      {
        type: "page_vue",
        nom: event.url.pathname,
        page: event.url.pathname,
        referrer: event.request.headers.get("referer"),
        campagne: campagneDepuisParametres(event.url.searchParams),
      },
      { repository: new DrizzleSuiviRepository() },
    );
  }
  return {
    actif: true,
    tenantSlug: tenant.slug,
    mesure: configuration.mesure,
    publicite: configuration.publicite,
    consentement,
    visiteurId,
    sessionId,
    scriptsMesure: scriptsMesure(configuration, consentement),
    scriptsPublicite: scriptsPublicite(configuration, consentement),
    scriptsClient: scriptsClientSuivi(tenant.slug, consentement),
  };
}

/**
 * Chargeur de script tiers qui ne retarde **aucun** événement de la page.
 *
 * Une balise `<script async src=…>` ne bloque pas `DOMContentLoaded` mais elle
 * retarde bel et bien `load` ; un vendeur injoignable (visiteur hors ligne,
 * réseau filtré, panne DNS) laissait donc la page en attente jusqu'au timeout
 * réseau, ce qui repoussait tout ce qui s'accroche à `load` — enregistrement du
 * service worker compris. Mesuré le 2026-11-13 : `plausible.io` injoignable ⇒
 * `page.goto(…, { waitUntil: "load" })` expirait au bout de 30 s alors que le
 * serveur répondait en 0,1 s.
 *
 * Ici la requête ne part qu'une fois la page chargée : la balise est créée par
 * un script inline (aucune ressource tierce dans le HTML initial), puis
 * ajoutée au `<head>` sur l'événement `load`, ou tout de suite si la page est
 * déjà chargée. Les appels de mesure (`_paq`, `gtag`, `data-domain`) sont
 * empilés avant, donc rien n'est perdu.
 */
function apresChargement(code: string): string {
  return (
    `(function(){var l=function(){${code}};` +
    `if(document.readyState==='complete')l();` +
    `else window.addEventListener('load',l,{once:true});})();`
  );
}

function chargeurTiers(attributs: Record<string, string>, source: string): string {
  return apresChargement(
    `var a=${JSON.stringify(attributs)},u=${JSON.stringify(source)};` +
      `var s=document.createElement('script');for(var k in a)s.setAttribute(k,a[k]);` +
      `s.async=true;s.src=u;(document.head||document.documentElement).appendChild(s);`,
  );
}

function scriptGtag(ids: string[]): string {
  if (ids.length === 0) return "";
  const principal = ids[0]!;
  const configs = ids
    .map((id) => `gtag('config', ${JSON.stringify(id)});`)
    .join("");
  return `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${configs}${chargeurTiers({}, `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(principal)}`)}</script>`;
}

export function scriptsMesure(
  configuration: ConfigurationSuivi,
  consentement: Consentement,
): string[] {
  if (!consentement.mesure) return [];
  const scripts: string[] = [];
  if (configuration.mesure.ga4Id) {
    scripts.push(scriptGtag([configuration.mesure.ga4Id]));
  }
  if (configuration.mesure.matomoUrl && configuration.mesure.matomoSiteId) {
    const url = JSON.stringify(`${configuration.mesure.matomoUrl}/`);
    const site = JSON.stringify(configuration.mesure.matomoSiteId);
    scripts.push(
      `<script>var _paq=window._paq=window._paq||[];_paq.push(['trackPageView']);_paq.push(['enableLinkTracking']);(function(){var u=${url};_paq.push(['setTrackerUrl',u+'matomo.php']);_paq.push(['setSiteId',${site}]);var d=document,g=d.createElement('script'),s=d.getElementsByTagName('script')[0];g.async=true;g.src=u+'matomo.js';s.parentNode.insertBefore(g,s);})();</script>`,
    );
  }
  if (configuration.mesure.plausibleDomain) {
    // Le script Plausible s'initialise tout seul à partir de `data-domain` :
    // l'ordre de chargement n'a aucune importance, donc il est injecté après
    // `load` comme les autres tiers (voir `chargeurTiers`).
    scripts.push(
      `<script>${chargeurTiers({ "data-domain": configuration.mesure.plausibleDomain }, "https://plausible.io/js/script.js")}</script>`,
    );
  }
  return scripts;
}

export function scriptsPublicite(
  configuration: ConfigurationSuivi,
  consentement: Consentement,
): string[] {
  if (!consentement.publicite || !consentement.mesure) return [];
  const scripts: string[] = [];
  if (configuration.publicite.googleAdsId) {
    const id = JSON.stringify(configuration.publicite.googleAdsId);
    scripts.push(
      configuration.mesure.ga4Id
        ? `<script>gtag('config',${id});</script>`
        : scriptGtag([configuration.publicite.googleAdsId]),
    );
  }
  if (configuration.publicite.metaPixelId) {
    const id = JSON.stringify(configuration.publicite.metaPixelId);
    // `fbq` est installé tout de suite (les appels sont mis en file), mais le
    // téléchargement de `fbevents.js` n'est déclenché qu'après `load`.
    scripts.push(
      `<script>!function(f,b){if(f.fbq)return;var n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];}(window,document);${chargeurTiers({}, "https://connect.facebook.net/en_US/fbevents.js")}fbq('init',${id});fbq('track','PageView');</script>`,
    );
  }
  if (configuration.publicite.tiktokPixelId) {
    const id = JSON.stringify(configuration.publicite.tiktokPixelId);
    // `ttq` est installé tout de suite (les appels sont mis en file), mais le
    // téléchargement du pixel n'est déclenché qu'après `load`.
    scripts.push(
      `<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};${apresChargement(`ttq.load(${id});ttq.page();`)};}(window,document,'ttq');</script>`,
    );
  }
  return scripts;
}

export function evenementConversion(
  nom: string,
  valeurCentimes: number | null,
  page: string,
): EvenementSuivi {
  return {
    type: "conversion",
    nom,
    page,
    referrer: null,
    campagne: {},
    valeurCentimes,
    metadata: {},
  };
}

export function campagneDeLaRequete(event: RequestEvent) {
  return campagneDepuisParametres(event.url.searchParams);
}

/**
 * Écouteur first-party minimal : clics et soumissions, sans valeur de champ.
 * Il ne s'active qu'avec le consentement « mesure » et reste sous 1 Ko.
 */
export function scriptsClientSuivi(
  tenantSlug: string,
  consentement: Consentement,
): string[] {
  if (!consentement.mesure) return [];
  const slug = JSON.stringify(tenantSlug);
  return [
    `<script>(function(){var t=${slug};function e(type,nom,meta){try{var c=document.cookie.match(/(?:^|; )lcd_consentement=([^;]+)/);if(!c||c[1].indexOf('m1')<0)return;navigator.sendBeacon('/api/suivi',new Blob([JSON.stringify({tenantSlug:t,evenement:{type:type,nom:nom,page:location.pathname,referrer:document.referrer||null,campagne:Object.fromEntries(new URLSearchParams(location.search)),metadata:meta}})],{type:'application/json'}));}catch(_){}}document.addEventListener('click',function(ev){var a=ev.target&&ev.target.closest?ev.target.closest('a,button'):null;if(!a)return;e('clic',(a.textContent||a.getAttribute('aria-label')||a.tagName).trim().slice(0,120),{tag:a.tagName.toLowerCase(),href:(a.getAttribute('href')||'').slice(0,200)});},true);document.addEventListener('submit',function(ev){var f=ev.target;if(!f||!f.action)return;e('soumission',(f.getAttribute('name')||new URL(f.action).pathname).slice(0,120),{action:(f.getAttribute('action')||'').slice(0,200)});},true);})();</script>`,
  ];
}
