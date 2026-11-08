import { describe, expect, it } from "vitest";
import {
  SEUILS_MICRO_CENTIMES,
  simulerFiscalite,
} from "@/domain/simulateur-fiscal";

describe("simulateur micro vs réel", () => {
  it("applique l’abattement de 30 % au micro-BIC non classé", () => {
    const resultat = simulerFiscalite({
      regime: "micro_bic_non_classe",
      recettesCentimes: 10_000_00,
      chargesCentimes: 0,
      amortissementsCentimes: 0,
    });
    expect(resultat.microPossible).toBe(true);
    expect(resultat.abattementCentimes).toBe(3_000_00);
    expect(resultat.baseMicroCentimes).toBe(7_000_00);
    expect(resultat.baseReelCentimes).toBe(10_000_00);
    expect(resultat.recommandation).toBe("micro");
  });

  it("recommande le réel quand les charges dépassent l’abattement", () => {
    const resultat = simulerFiscalite({
      regime: "micro_bic_non_classe",
      recettesCentimes: 10_000_00,
      chargesCentimes: 5_000_00,
      amortissementsCentimes: 3_000_00,
    });
    expect(resultat.baseReelCentimes).toBe(2_000_00);
    expect(resultat.ecartBaseCentimes).toBe(5_000_00);
    expect(resultat.recommandation).toBe("reel");
  });

  it("signale un déficit reportable au réel", () => {
    const resultat = simulerFiscalite({
      regime: "micro_bic_classe",
      recettesCentimes: 20_000_00,
      chargesCentimes: 15_000_00,
      amortissementsCentimes: 8_000_00,
    });
    expect(resultat.baseReelCentimes).toBe(0);
    expect(resultat.deficitReportableCentimes).toBe(3_000_00);
    expect(resultat.recommandation).toBe("reel");
  });

  it("rend le micro indisponible au-delà du seuil", () => {
    const resultat = simulerFiscalite({
      regime: "micro_bic_non_classe",
      recettesCentimes: SEUILS_MICRO_CENTIMES.micro_bic_non_classe + 1,
      chargesCentimes: 0,
      amortissementsCentimes: 0,
    });
    expect(resultat.microPossible).toBe(false);
    expect(resultat.baseMicroCentimes).toBeNull();
    expect(resultat.abattementCentimes).toBeNull();
    expect(resultat.recommandation).toBe("micro_indisponible");
  });

  it("refuse les montants négatifs", () => {
    expect(() =>
      simulerFiscalite({
        regime: "micro_bic_non_classe",
        recettesCentimes: -1,
        chargesCentimes: 0,
        amortissementsCentimes: 0,
      }),
    ).toThrow("centimes positifs");
  });
});
