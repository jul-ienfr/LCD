import { describe, expect, it } from "vitest";
import {
  creerTokenCalendrier,
  verifierTokenCalendrier,
} from "@/lib/calendrier-token";

const base = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  logementId: "22222222-2222-4222-8222-222222222222",
};

describe("calendrier-token", () => {
  it("crée et vérifie un token de calendrier", () => {
    const token = creerTokenCalendrier(base);
    const payload = verifierTokenCalendrier(token);
    expect(payload?.tenantId).toBe(base.tenantId);
    expect(payload?.logementId).toBe(base.logementId);
  });

  it("refuse un token altéré", () => {
    const token = creerTokenCalendrier(base);
    expect(verifierTokenCalendrier(`${token.slice(0, -2)}xx`)).toBeNull();
  });

  it("refuse un token expiré", () => {
    expect(
      verifierTokenCalendrier(creerTokenCalendrier({ ...base, exp: 1 })),
    ).toBeNull();
  });

  it("refuse un token vide ou mal formé", () => {
    expect(verifierTokenCalendrier("")).toBeNull();
    expect(verifierTokenCalendrier("abc")).toBeNull();
    expect(verifierTokenCalendrier("abc.def")).toBeNull();
  });
});
