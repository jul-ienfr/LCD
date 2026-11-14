/**
 * T610 — Garde statique PWA : manifest, service worker, îlot d'installation.
 *
 * Ces vérifications ne remplacent pas un test navigateur, mais empêchent une
 * régression silencieuse (manifest retiré, handler push supprimé, îlot qui
 * grossit ou perd la détection d'installation).
 */
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const RACINE = process.cwd();
const lire = (chemin: string): string =>
  readFileSync(join(RACINE, chemin), "utf8");

describe("PWA (T610)", () => {
  it("app.html déclare le manifest et enregistre le service worker", () => {
    const html = lire("src/app.html");
    expect(html).toContain('rel="manifest"');
    expect(html).toContain("/manifest.webmanifest");
    expect(html).toContain("/register-sw.js");
    expect(html).toContain("apple-mobile-web-app-capable");
  });

  it("le manifest est installable : standalone, icônes 192/512 et maskable", () => {
    const source = lire("src/routes/manifest.webmanifest/+server.ts");
    expect(source).toContain('display: "standalone"');
    expect(source).toContain("192x192");
    expect(source).toContain("512x512");
    expect(source).toContain('purpose: "maskable"');
    expect(source).toContain("prefer_related_applications: false");
    expect(source).toContain("start_url");
    expect(source).toContain("scope");
  });

  it("le service worker gère push et notificationclick et sert le fallback hors ligne", () => {
    const sw = lire("static/sw.js");
    expect(sw).toContain('addEventListener("push"');
    expect(sw).toContain('addEventListener("notificationclick"');
    expect(sw).toContain("showNotification");
    expect(sw).toContain("/offline");
    expect(sw).toContain('VERSION = "lcd-v2-2026-11-10-1"');
    // Les espaces staff et l'API ne doivent jamais être mis en cache.
    expect(sw).toContain('"/hote"');
    expect(sw).toContain('"/api/"');
  });

  it("l'îlot d'installation reste léger et détecte installation + notifications", () => {
    const chemin = join(RACINE, "static/pwa.js");
    const source = readFileSync(chemin, "utf8");
    expect(source).toContain("beforeinstallprompt");
    expect(source).toContain("requestPermission");
    expect(source).toContain("appinstalled");
    expect(source).toContain("display-mode: standalone");
    expect(statSync(chemin).size).toBeLessThan(4096);
  });

  it("la page staff d'installation est réservée aux rôles admin/hote", () => {
    const serveur = lire("src/routes/hote/installation/+page.server.ts");
    expect(serveur).toContain('requireRole(event, ["admin", "hote"])');
    const page = lire("src/routes/hote/installation/+page.svelte");
    expect(page).toContain('src="/pwa.js"');
    expect(page).toContain("data-pwa-installer");
    expect(page).toContain("data-pwa-notifications");
    expect(page).toContain("data-pwa-statut");
  });
});
