import { describe, expect, it } from "vitest";
import {
  numeroFactureValide,
  prochainNumeroFacture,
  totauxFacture,
  totalLigne,
} from "@/domain/facture";

describe("facture", () => {
  it("valide un numéro de facture", () => {
    expect(numeroFactureValide("FAC-2026-0001")).toBe(true);
    expect(numeroFactureValide("fac-2026-0001")).toBe(false);
    expect(numeroFactureValide("F")).toBe(false);
  });

  it("calcule le total d'une ligne", () => {
    expect(totalLigne(7, 12_000)).toBe(84_000);
  });

  it("refuse une quantité nulle", () => {
    expect(() => totalLigne(0, 12_000)).toThrow();
  });

  it("calcule HT et TTC avec TVA et taxe de séjour", () => {
    expect(
      totauxFacture(
        [
          { totalCentimes: 84_000 },
          { totalCentimes: 3_500 },
        ],
        8_750,
        1_400,
      ),
    ).toEqual({ htCentimes: 87_500, ttcCentimes: 97_650 });
  });

  it("calcule le prochain numéro avec le préfixe du tenant", () => {
    expect(
      prochainNumeroFacture(
        ["FAC-2026-0001", "FAC-2026-0004", "AUT-2026-0099"],
        2026,
      ),
    ).toBe("FAC-2026-0005");
    expect(
      prochainNumeroFacture([], 2026, "SEJ"),
    ).toBe("SEJ-2026-0001");
  });
});
