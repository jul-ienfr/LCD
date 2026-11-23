/**
 * En-têtes de cache des pages SSR (spec 006, FR-028).
 *
 * Le cache public est réservé aux pages vitrine anonymes ; session, cookie
 * de langue, écriture de cookie et méthodes non-GET forcent `private, no-store`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  cachePublic,
  enteteCacheHtml,
  pagePubliqueCacheable,
  type ContexteCacheHtml,
} from "@/lib/server/cache-http";

const contexte = (
  remplacements: Partial<ContexteCacheHtml> = {},
): ContexteCacheHtml => ({
  chemin: "/",
  methode: "GET",
  statut: 200,
  contentType: "text/html; charset=utf-8",
  aSession: false,
  aCookieLangue: false,
  aSetCookie: false,
  cacheControlExistant: null,
  ...remplacements,
});

describe("cache des pages SSR publiques (FR-028)", () => {
  it("accueil anonyme : cache public court, navigateur et CDN", () => {
    const entete = enteteCacheHtml(contexte());
    expect(entete).toBe(
      "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
    );
    expect(cachePublic(entete)).toBe(true);
  });

  it("site publié : même politique que l'accueil", () => {
    expect(
      enteteCacheHtml(contexte({ chemin: "/site/maison-aurea" })),
    ).toContain("public, max-age=60");
  });

  it("contenu documentaire : cache public plus long", () => {
    for (const chemin of ["/aide", "/legales", "/design", "/developpeurs", "/tarifs"]) {
      expect(enteteCacheHtml(contexte({ chemin }))).toContain(
        "public, max-age=300, s-maxage=3600",
      );
    }
  });

  it("sous-chemin d'une page exacte : pas de cache public", () => {
    expect(pagePubliqueCacheable("/aide/autre")).toBeNull();
    expect(enteteCacheHtml(contexte({ chemin: "/aide/autre" }))).toBe(
      "private, no-store",
    );
  });

  it("session présente : jamais de cache partagé, même sur l'accueil", () => {
    expect(enteteCacheHtml(contexte({ aSession: true }))).toBe(
      "private, no-store",
    );
  });

  it("écriture de cookie : réponse privée", () => {
    expect(enteteCacheHtml(contexte({ aSetCookie: true }))).toBe(
      "private, no-store",
    );
  });

  it("cookie de langue : rendu personnalisé donc privé", () => {
    expect(enteteCacheHtml(contexte({ aCookieLangue: true }))).toBe(
      "private, no-store",
    );
  });

  it("méthode non-GET ou statut non-200 : privé", () => {
    expect(enteteCacheHtml(contexte({ methode: "POST", statut: 303 }))).toBe(
      "private, no-store",
    );
    expect(enteteCacheHtml(contexte({ statut: 404 }))).toBe(
      "private, no-store",
    );
  });

  it("espaces privés et pages signées : privé", () => {
    for (const chemin of [
      "/hote",
      "/presta",
      "/voyageur",
      "/reserver",
      "/facture/abc",
      "/guide/jeton",
      "/contrat/jeton",
      "/supervision",
      "/login",
    ]) {
      expect(enteteCacheHtml(contexte({ chemin }))).toBe("private, no-store");
    }
  });

  it("réponse non-HTML : aucun en-tête posé", () => {
    expect(
      enteteCacheHtml(contexte({ contentType: "application/json" })),
    ).toBeNull();
    expect(enteteCacheHtml(contexte({ contentType: null }))).toBeNull();
  });

  it("cache déjà décidé par la route : laissé tel quel", () => {
    expect(
      enteteCacheHtml(
        contexte({ cacheControlExistant: "public, max-age=300" }),
      ),
    ).toBeNull();
  });

  it("cachePublic ne reconnaît que les en-têtes publics", () => {
    expect(cachePublic("private, no-store")).toBe(false);
    expect(cachePublic(null)).toBe(false);
    expect(cachePublic("public, max-age=60")).toBe(true);
  });

  it("les hooks appliquent la politique et posent Vary: Cookie", () => {
    const hooks = readFileSync(
      new URL("../../../src/hooks.server.ts", import.meta.url),
      "utf-8",
    );
    expect(hooks).toContain("enteteCacheHtml({");
    expect(hooks).toContain('entetes.set("Cache-Control", cacheControl)');
    expect(hooks).toContain('entetes.set("Vary", "Cookie")');
    expect(hooks).toContain("event.locals.session");
  });
});
