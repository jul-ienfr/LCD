import { describe, expect, it } from "vitest";
import {
  creerTokenVoyageur,
  tokenVoyageurExpireDansJours,
  verifierTokenVoyageur,
} from "@/lib/voyageur-token";

const base = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  logementId: "22222222-2222-4222-8222-222222222222",
  reservationId: "33333333-3333-4333-8333-333333333333",
};

describe("voyageur-token", () => {
  it("crée et vérifie un token", () => {
    const token = creerTokenVoyageur(base);
    const payload = verifierTokenVoyageur(token);
    expect(payload?.reservationId).toBe(base.reservationId);
    expect(payload?.logementId).toBe(base.logementId);
  });

  it("refuse un token altéré", () => {
    const token = creerTokenVoyageur(base);
    const altere = `${token.slice(0, -2)}xx`;
    expect(verifierTokenVoyageur(altere)).toBeNull();
  });

  it("refuse un token expiré", () => {
    const token = creerTokenVoyageur({ ...base, exp: 1 });
    expect(verifierTokenVoyageur(token)).toBeNull();
  });

  it("calcule une expiration après le séjour", () => {
    const exp = tokenVoyageurExpireDansJours("2026-12-05");
    expect(exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});
