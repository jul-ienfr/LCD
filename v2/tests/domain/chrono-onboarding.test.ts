import { describe, expect, it } from "vitest";
import {
  construireChrono,
  formaterDureeChrono,
} from "@/domain/chrono-onboarding";

const debut = new Date("2026-11-10T08:00:00.000Z");

function evenement(
  action: string,
  minutes: number,
  payload?: Record<string, unknown>,
) {
  return {
    action,
    createdAt: new Date(debut.getTime() + minutes * 60_000),
    payload,
  };
}

describe("chrono d’onboarding", () => {
  it("mesure chaque étape réellement franchie", () => {
    const chrono = construireChrono(debut, [
      evenement("logement.creer", 30),
      evenement("logement.copro", 45, { verifiee: false }),
      evenement("logement.copro", 90, { verifiee: true }),
      evenement("logement.publication", 120, { publication: "brouillon" }),
      evenement("logement.publication", 180, { publication: "publiee" }),
      evenement("reservation.test_creer", 240),
    ]);

    expect(chrono.termine).toBe(true);
    expect(chrono.totalMs).toBe(240 * 60_000);
    const parCode = new Map(chrono.etapes.map((etape) => [etape.code, etape]));
    expect(parCode.get("logement")?.depuisDebutMs).toBe(30 * 60_000);
    expect(parCode.get("copro")?.dureeMs).toBe(60 * 60_000);
    expect(parCode.get("publication")?.dureeMs).toBe(90 * 60_000);
    expect(parCode.get("reservation_test")?.dureeMs).toBe(60 * 60_000);
  });

  it("laisse absente une étape non franchie sans la compter", () => {
    const maintenant = new Date(debut.getTime() + 60 * 60_000);
    const chrono = construireChrono(
      debut,
      [evenement("logement.creer", 20)],
      maintenant,
    );

    expect(chrono.termine).toBe(false);
    expect(chrono.totalMs).toBe(20 * 60_000);
    expect(chrono.etapes.find((e) => e.code === "copro")?.at).toBeNull();
    expect(chrono.etapes.find((e) => e.code === "copro")?.dureeMs).toBeNull();
  });

  it("ignore un événement antérieur au début", () => {
    const chrono = construireChrono(debut, [
      {
        action: "logement.creer",
        createdAt: new Date(debut.getTime() - 60_000),
        payload: {},
      },
    ]);
    expect(chrono.etapes.find((e) => e.code === "logement")?.depuisDebutMs).toBe(
      0,
    );
  });

  it("formate les durées de façon lisible", () => {
    expect(formaterDureeChrono(null)).toBe("—");
    expect(formaterDureeChrono(30_000)).toBe("< 1 min");
    expect(formaterDureeChrono(90 * 60_000)).toBe("1 h 30 min");
    expect(formaterDureeChrono(26 * 60 * 60_000)).toBe("1 j 2 h");
  });
});
