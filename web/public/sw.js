// web/public/sw.js — service worker MAISON (F4 §F8), 0 framework, ~150 lignes.
// Contrat cahier 70-front-v1 §F8 :
//  - précache shell (les 2 dashboards concernés) ; network-first pour les
//    pages ; cache-first pour les assets hashés ; JAMAIS de cache API
//    (/api/* et /v1/* = réseau seul : une écriture n'est jamais servie
//    depuis un cache, le SW ne ment jamais) ;
//  - purge : message "lcd-purge" (checkout+12 h / révocation) + purge
//    automatique d'une page dont le réseau répond 401/403/404/410 (lien
//    révoqué : le guide stale n'a plus le droit d'être servi) ;
//  - offline 2 h : les pages déjà visitées restent lisibles (contenu SSR
//    intégré au HTML, aucune donnée API requise pour le rendu de base).
// Version = identité de cache : toute évolution SW incrémente VERSION et
// l'activate purge les anciens caches (rétention bornée, jamais de brouille).
const VERSION = "lcd-v1-2026-10-19";
const CACHE_PAGES = `${VERSION}-pages`;
const CACHE_ASSETS = `${VERSION}-assets`;
// Shell = les 2 dashboards offline (voyageur = guide séjour, presta = runbook).
const PRECACHE = ["/voyageur", "/presta"];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches
      .open(CACHE_PAGES)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches
      .keys()
      .then((cles) =>
        Promise.all(
          cles
            .filter((c) => c.startsWith("lcd-") && c !== CACHE_PAGES && c !== CACHE_ASSETS)
            .map((c) => caches.delete(c)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Purge explicite (checkout+12 h / révocation lien magique §S3.5-V1).
self.addEventListener("message", (ev) => {
  if (ev.data && ev.data.type === "lcd-purge") {
    ev.waitUntil(
      caches.keys().then((cles) =>
        Promise.all(cles.filter((c) => c.startsWith("lcd-")).map((c) => caches.delete(c))),
      ).then(() => {
        if (ev.ports && ev.ports[0]) ev.ports[0].postMessage({ type: "lcd-purge-vide" });
      }),
    );
  }
});

self.addEventListener("fetch", (ev) => {
  const req = ev.request;
  const url = new URL(req.url);
  // Hors même origine (tierces) : laisser passer tel quel (0 requête tierce
  // au chargement de toute façon, cf. cahier).
  if (url.origin !== self.location.origin) return;
  // Écritures : JAMAIS interceptées (POST/PUT/DELETE partent telles quelles ;
  // c'est le formulaire JS (outbox IndexedDB) qui met en attente, pas le SW).
  if (req.method !== "GET") return;
  // API : réseau seul, jamais de cache (le SW ne doit pas mentir sur l'état).
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/v1/")) return;

  // Assets hashés Next : cache-first (immutables par définition de hash).
  if (url.pathname.startsWith("/_next/static/")) {
    ev.respondWith(
      caches.open(CACHE_ASSETS).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const rep = await fetch(req);
        if (rep.ok) c.put(req, rep.clone());
        return rep;
      }),
    );
    return;
  }

  // Pages : network-first, repli cache (le guide reste lisible 2 h sans WAN).
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    ev.respondWith(
      (async () => {
        try {
          const rep = await fetch(req);
          // Révoqué (401/403/404/410) : purger le stale, ne jamais le resservir.
          if ([401, 403, 404, 410].includes(rep.status)) {
            const c = await caches.open(CACHE_PAGES);
            await c.delete(req.url, { ignoreSearch: true });
            return rep;
          }
          if (rep.ok) {
            const c = await caches.open(CACHE_PAGES);
            c.put(req, rep.clone());
          }
          return rep;
        } catch {
          const c = await caches.open(CACHE_PAGES);
          // 1er repli : URL exacte ; 2e : même page sans query (?logement=…).
          const hit = (await c.match(req)) || (await c.match(req.url, { ignoreSearch: true }));
          if (hit) return hit;
          // Dernier repli : le shell précaché de la page la plus proche.
          const racine = url.pathname.startsWith("/presta") ? "/presta" : "/voyageur";
          const shell = await c.match(racine);
          if (shell) return shell;
          return new Response(
            "Hors ligne et aucune copie locale de cette page. " +
              "Reconnectez-vous : le contenu déjà visité reste consultable.",
            { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } },
          );
        }
      })(),
    );
  }
});
