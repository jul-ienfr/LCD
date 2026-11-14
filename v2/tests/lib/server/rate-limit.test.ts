import { describe, expect, it, vi } from "vitest";
import { creerRateLimiter, LIMITES_DEFAUT } from "@/lib/server/rate-limit";

describe("rate limiter (fenêtre glissante)", () => {
  it("autorise les requêtes sous le seuil", () => {
    const limiter = creerRateLimiter({ max: 3, fenetreMs: 60_000 });
    expect(limiter.autoriser("cle-1")).toBe(true);
    expect(limiter.autoriser("cle-1")).toBe(true);
    expect(limiter.autoriser("cle-1")).toBe(true);
  });

  it("refuse au-delà du seuil", () => {
    const limiter = creerRateLimiter({ max: 2, fenetreMs: 60_000 });
    expect(limiter.autoriser("cle-1")).toBe(true);
    expect(limiter.autoriser("cle-1")).toBe(true);
    expect(limiter.autoriser("cle-1")).toBe(false);
  });

  it("isole les clés entre elles", () => {
    const limiter = creerRateLimiter({ max: 1, fenetreMs: 60_000 });
    expect(limiter.autoriser("a")).toBe(true);
    expect(limiter.autoriser("a")).toBe(false);
    expect(limiter.autoriser("b")).toBe(true);
  });

  it("réinitialise une clé spécifique", () => {
    const limiter = creerRateLimiter({ max: 1, fenetreMs: 60_000 });
    limiter.autoriser("x");
    expect(limiter.autoriser("x")).toBe(false);
    limiter.reinitialiser("x");
    expect(limiter.autoriser("x")).toBe(true);
  });

  it("vide toutes les clés", () => {
    const limiter = creerRateLimiter({ max: 1, fenetreMs: 60_000 });
    limiter.autoriser("a");
    limiter.autoriser("b");
    limiter.vider();
    expect(limiter.autoriser("a")).toBe(true);
    expect(limiter.autoriser("b")).toBe(true);
  });

  it("retourne le nombre restant correct", () => {
    const limiter = creerRateLimiter({ max: 5, fenetreMs: 60_000 });
    expect(limiter.restant("k")).toBe(5);
    limiter.autoriser("k");
    limiter.autoriser("k");
    expect(limiter.restant("k")).toBe(3);
  });

  it("retourne 0 quand le seuil est atteint", () => {
    const limiter = creerRateLimiter({ max: 1, fenetreMs: 60_000 });
    limiter.autoriser("k");
    expect(limiter.restant("k")).toBe(0);
  });

  it("les limiters par défaut sont fonctionnels", () => {
    const api = LIMITES_DEFAUT.apiPublique();
    expect(api.autoriser("test")).toBe(true);
    const login = LIMITES_DEFAUT.login();
    expect(login.autoriser("test")).toBe(true);
    const webhook = LIMITES_DEFAUT.webhook();
    expect(webhook.autoriser("test")).toBe(true);
    const sync = LIMITES_DEFAUT.syncFournisseur();
    expect(sync.autoriser("test")).toBe(true);
  });
});
