import { describe, expect, it } from "vitest";
import {
  calculerRemise,
  codePromoValide,
  normaliserCodePromo,
  promotionApplicable,
  type Promotion,
} from "@/domain/promotion";

function promotion(partiel: Partial<Promotion> = {}): Promotion {
  return {
    id: "p1",
    code: "MER-10",
    type: "pourcentage",
    valeur: 10,
    conditions: {},
    actif: true,
    debutAt: null,
    finAt: null,
    ...partiel,
  };
}

describe("code promotionnel", () => {
  it("normalise en majuscules", () => {
    expect(normaliserCodePromo(" mer-10 ")).toBe("MER-10");
  });

  it("accepte un code lisible", () => {
    expect(codePromoValide("MER-10")).toBe(true);
    expect(codePromoValide("A1")).toBe(false);
    expect(codePromoValide("code avec espace")).toBe(false);
  });
});

describe("promotionApplicable", () => {
  const contexte = {
    nuits: 7,
    montantCentimes: 100_000,
    logementId: "log-1",
    date: "2026-11-06",
  };

  it("accepte une promotion active sans condition", () => {
    expect(promotionApplicable(promotion(), contexte)).toBe(true);
  });

  it("refuse une promotion inactive", () => {
    expect(promotionApplicable(promotion({ actif: false }), contexte)).toBe(
      false,
    );
  });

  it("refuse un logement différent", () => {
    expect(
      promotionApplicable(
        promotion({ conditions: { logementId: "log-2" } }),
        contexte,
      ),
    ).toBe(false);
  });

  it("applique les bornes de nuits et de montant", () => {
    expect(
      promotionApplicable(
        promotion({ conditions: { minNuits: 7, maxNuits: 7 } }),
        contexte,
      ),
    ).toBe(true);
    expect(
      promotionApplicable(
        promotion({ conditions: { minNuits: 8 } }),
        contexte,
      ),
    ).toBe(false);
    expect(
      promotionApplicable(
        promotion({ conditions: { minMontantCentimes: 100_001 } }),
        contexte,
      ),
    ).toBe(false);
  });

  it("applique la fenêtre de dates", () => {
    const p = promotion({
      debutAt: new Date("2026-11-01T00:00:00Z"),
      finAt: new Date("2026-11-30T00:00:00Z"),
    });
    expect(promotionApplicable(p, contexte)).toBe(true);
    expect(
      promotionApplicable(p, { ...contexte, date: "2026-12-01" }),
    ).toBe(false);
  });
});

describe("calculerRemise", () => {
  it("calcule un pourcentage", () => {
    expect(calculerRemise(promotion(), 100_000)).toBe(10_000);
  });

  it("calcule un montant fixe et le plafonne au total", () => {
    expect(
      calculerRemise(promotion({ type: "montant", valeur: 25_000 }), 100_000),
    ).toBe(25_000);
    expect(
      calculerRemise(promotion({ type: "montant", valeur: 200_000 }), 100_000),
    ).toBe(100_000);
  });

  it("refuse une promotion mal formée", () => {
    expect(() => calculerRemise(promotion({ valeur: 0 }), 1_000)).toThrow(
      "promotion",
    );
    expect(() =>
      calculerRemise(promotion({ valeur: 101 }), 1_000),
    ).toThrow("promotion");
  });
});
