// Service worker LCD v2 — maison, sans framework.
// Règles :
// - pages publiques/voyageur : network-first + cache de secours ;
// - assets hashés : cache-first ;
// - API, auth, staff : JAMAIS mis en cache ;
// - offline : fallback /offline ;
// - purge explicite par message `lcd-purge`.
const VERSION = "lcd-v2-2026-10-24-1";

const PRECACHE = [
  "/",
  "/voyageur",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
];

const SENSIBLE = ["/hote", "/login", "/two-factor", "/api/"];

function estSensible(pathname) {
  return SENSIBLE.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const noms = await caches.keys();
      await Promise.all(
        noms.filter((nom) => nom !== VERSION).map((nom) => caches.delete(nom)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "lcd-purge") {
    event.waitUntil(
      (async () => {
        const noms = await caches.keys();
        await Promise.all(noms.map((nom) => caches.delete(nom)));
      })(),
    );
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(VERSION);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, { cacher }) {
  try {
    const response = await fetch(request);
    if (cacher && response.ok) {
      const cache = await caches.open(VERSION);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.mode === "navigate") {
      const offline = await caches.match("/offline");
      if (offline) return offline;
    }

    return new Response("Hors ligne", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  const cacher = !estSensible(url.pathname);
  event.respondWith(networkFirst(request, { cacher }));
});
