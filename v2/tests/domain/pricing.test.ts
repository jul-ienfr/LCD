import { describe, expect, it } from "vitest";
import { nuitsEntre, prixSejour } from "@/domain/pricing";

describe("pricing", () => {
  it("calcule les nuits entre deux dates (fin exclusive)", () => {
    expect(nuitsEntre("2026-07-01", "2026-07-08")).toBe(7);
  });

  it("refuse une date de fin avant la date de début", () => {
    expect(() => nuitsEntre("2026-07-08", "2026-07-01")).toThrow();
  });

  it("refuse un format de date non ISO", () => {
    expect(() => nuitsEntre("01/07/2026", "2026-07-08")).toThrow();
  });

  it("calcule un total en centimes, sans flottants", () => {
    expect(
      prixSejour({
        prixNuitCentimes: 12_000,
        nuits: 7,
        extrasCentimes: 3_500,
        taxeSejourCentimes: 1_400,
        remiseCentimes: 2_000,
      }),
    ).toBe(86_900);
  });

  it("refuse un total négatif", () => {
    expect(() =>
      prixSejour({
        prixNuitCentimes: 1_000,
        nuits: 1,
        remiseCentimes: 2_000,
      }),
    ).toThrow();
  });
});
