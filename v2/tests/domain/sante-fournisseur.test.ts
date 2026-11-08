import { describe, expect, it } from "vitest";
import { evaluerSanteSync } from "@/domain/sante-fournisseur";

const MAINTENANT = new Date("2026-10-25T12:00:00.000Z");

describe("evaluerSanteSync", () => {
  it("signale une synchronisation jamais faite", () => {
    expect(
      evaluerSanteSync({
        derniereSync: null,
        dernierStatut: null,
        intervalleMinutes: 0,
        maintenant: MAINTENANT,
      }),
    ).toEqual({ etat: "jamais", ageMinutes: null, seuilMinutes: 5 });
  });

  it("considère une synchronisation récente comme à jour", () => {
    expect(
      evaluerSanteSync({
        derniereSync: new Date("2026-10-25T11:58:00.000Z"),
        dernierStatut: "ok",
        intervalleMinutes: 0,
        maintenant: MAINTENANT,
      }),
    ).toMatchObject({ etat: "ok", ageMinutes: 2 });
  });

  it("signale un retard au-delà du seuil", () => {
    expect(
      evaluerSanteSync({
        derniereSync: new Date("2026-10-25T11:50:00.000Z"),
        dernierStatut: "ok",
        intervalleMinutes: 0,
        maintenant: MAINTENANT,
      }),
    ).toMatchObject({ etat: "retard", ageMinutes: 10, seuilMinutes: 5 });
  });

  it("signale une erreur même si la date est récente", () => {
    expect(
      evaluerSanteSync({
        derniereSync: new Date("2026-10-25T11:59:00.000Z"),
        dernierStatut: "erreur",
        intervalleMinutes: 0,
        maintenant: MAINTENANT,
      }).etat,
    ).toBe("erreur");
  });

  it("signale un statut partiel", () => {
    expect(
      evaluerSanteSync({
        derniereSync: new Date("2026-10-25T11:59:00.000Z"),
        dernierStatut: "partiel",
        intervalleMinutes: 0,
        maintenant: MAINTENANT,
      }).etat,
    ).toBe("partiel");
  });

  it("élargit le seuil pour les fournisseurs à quota", () => {
    expect(
      evaluerSanteSync({
        derniereSync: new Date("2026-10-25T10:00:00.000Z"),
        dernierStatut: "ok",
        intervalleMinutes: 60,
        maintenant: MAINTENANT,
      }),
    ).toMatchObject({ etat: "ok", seuilMinutes: 120 });
  });
});
