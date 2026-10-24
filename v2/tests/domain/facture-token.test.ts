import { describe, expect, it } from "vitest";
import {
  creerTokenFacture,
  verifierTokenFacture,
} from "@/lib/facture-token";

const base = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  factureId: "22222222-2222-4222-8222-222222222222",
};

describe("facture-token", () => {
  it("crée et vérifie un token de facture", () => {
    const token = creerTokenFacture(base);
    const payload = verifierTokenFacture(token);
    expect(payload?.tenantId).toBe(base.tenantId);
    expect(payload?.factureId).toBe(base.factureId);
  });

  it("refuse un token altéré", () => {
    const token = creerTokenFacture(base);
    const altere = `${token.slice(0, -2)}xx`;
    expect(verifierTokenFacture(altere)).toBeNull();
  });

  it("refuse un token expiré", () => {
    const token = creerTokenFacture({ ...base, exp: 1 });
    expect(verifierTokenFacture(token)).toBeNull();
  });

  it("refuse un token vide ou mal formé", () => {
    expect(verifierTokenFacture("")).toBeNull();
    expect(verifierTokenFacture("abc")).toBeNull();
    expect(verifierTokenFacture("abc.def")).toBeNull();
  });
});
