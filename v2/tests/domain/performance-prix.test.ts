import { describe, expect, it } from "vitest";
import {
  comparerRevPar,
  ecartCumuleDecisions,
  indicateursPeriode,
} from "@/domain/performance-prix";

describe("indicateurs de performance locative", () => {
  it("calcule occupation, ADR et RevPAR sans division par zéro", () => {
    const indicateurs = indicateursPeriode({
      jours: 30,
      nuitsVendues: 18,
      revenusCentimes: 180_000,
    });
    expect(indicateurs.tauxOccupation).toBe(0.6);
    expect(indicateurs.adrCentimes).toBe(10_000);
    expect(indicateurs.revParCentimes).toBe(6_000);

    expect(
      indicateursPeriode({ jours: 30, nuitsVendues: 0, revenusCentimes: 0 }),
    ).toEqual({
      jours: 30,
      nuitsVendues: 0,
      revenusCentimes: 0,
      tauxOccupation: 0,
      adrCentimes: null,
      revParCentimes: 0,
    });

    expect(indicateursPeriode({ jours: 0, nuitsVendues: 0, revenusCentimes: 0 }).revParCentimes).toBeNull();
  });

  it("refuse des données impossibles", () => {
    expect(() =>
      indicateursPeriode({ jours: 10, nuitsVendues: 11, revenusCentimes: 0 }),
    ).toThrow(/nuits vendues/i);
    expect(() =>
      indicateursPeriode({ jours: 10, nuitsVendues: 1, revenusCentimes: -5 }),
    ).toThrow(/revenusCentimes/);
  });

  it("compare deux périodes de même durée", () => {
    const comparaison = comparerRevPar(
      { jours: 30, nuitsVendues: 15, revenusCentimes: 150_000 },
      { jours: 30, nuitsVendues: 18, revenusCentimes: 198_000 },
    );
    expect(comparaison.comparable).toBe(true);
    expect(comparaison.avant.revParCentimes).toBe(5_000);
    expect(comparaison.apres.revParCentimes).toBe(6_600);
    expect(comparaison.ecartRevParCentimes).toBe(1_600);
    expect(comparaison.ecartRevParPourcent).toBe(32);
  });

  it("refuse de comparer des périodes de durées différentes", () => {
    const comparaison = comparerRevPar(
      { jours: 30, nuitsVendues: 15, revenusCentimes: 150_000 },
      { jours: 60, nuitsVendues: 18, revenusCentimes: 198_000 },
    );
    expect(comparaison.comparable).toBe(false);
    expect(comparaison.ecartRevParPourcent).toBeNull();
  });

  it("cumule l'écart des décisions de prix appliquées", () => {
    const cumul = ecartCumuleDecisions([
      { prixActuelCentimes: 12_000, prixAppliqueCentimes: 15_000 },
      { prixActuelCentimes: 10_000, prixAppliqueCentimes: 8_000 },
      { prixActuelCentimes: null, prixAppliqueCentimes: 20_000 },
    ]);
    expect(cumul.jours).toBe(3);
    expect(cumul.ecartCentimes).toBe(1_000);
    expect(cumul.ecartMoyenCentimes).toBe(500);

    expect(ecartCumuleDecisions([])).toEqual({
      jours: 0,
      ecartCentimes: 0,
      ecartMoyenCentimes: null,
    });
  });
});
