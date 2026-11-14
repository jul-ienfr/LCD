import { describe, expect, it } from "vitest";
import { ErreurMetier } from "@/domain/erreurs";
import {
  BORNES_PRIX_DEFAUT,
  bornerPrix,
  ecartPourcent,
  joursInclus,
  prixEffectif,
  recommandationARetenir,
  resumerFacteurs,
  validerBornesPrix,
  validerRecommandation,
  type RecommandationPrix,
} from "@/domain/recommandation-prix";

function recommandation(
  partiel: Partial<RecommandationPrix> = {},
): RecommandationPrix {
  return {
    logementId: "logement-1",
    jour: "2026-12-24",
    prixActuelCentimes: 12_000,
    prixRecommandeCentimes: 15_000,
    source: "partenaire",
    confiance: 70,
    facteurs: [
      { code: "weekend", libelle: "Week-end", impactPourcent: 12 },
      { code: "vacances", libelle: "Vacances scolaires", impactPourcent: 20 },
    ],
    statut: "proposee",
    importeeLe: "2026-11-09T06:00:00.000Z",
    ...partiel,
  };
}

describe("recommandations de prix", () => {
  it("borne un prix avec arrondi lisible et respecte les limites absolues", () => {
    expect(bornerPrix(15_137, BORNES_PRIX_DEFAUT)).toBe(15_150);
    expect(bornerPrix(100, BORNES_PRIX_DEFAUT)).toBe(2_000);
    expect(bornerPrix(900_000, BORNES_PRIX_DEFAUT)).toBe(200_000);
    expect(bornerPrix(900_000, { minCentimes: 1_000, maxCentimes: 9_000_000 })).toBe(
      500_000,
    );
  });

  it("refuse des bornes incohérentes", () => {
    expect(() =>
      validerBornesPrix({ minCentimes: 20_000, maxCentimes: 10_000 }),
    ).toThrow(ErreurMetier);
    expect(validerBornesPrix({ minCentimes: 100, maxCentimes: 9_000_000 })).toEqual(
      { minCentimes: 1_000, maxCentimes: 500_000 },
    );
  });

  it("calcule l'écart en pourcent sans diviser par zéro", () => {
    expect(ecartPourcent(12_000, 15_000)).toBe(25);
    expect(ecartPourcent(12_000, 9_000)).toBe(-25);
    expect(ecartPourcent(null, 15_000)).toBeNull();
    expect(ecartPourcent(0, 15_000)).toBeNull();
  });

  it("valide une recommandation complète et rejette les saisies douteuses", () => {
    expect(() => validerRecommandation(recommandation())).not.toThrow();
    expect(() => validerRecommandation(recommandation({ jour: "24/12/2026" }))).toThrow(
      /Jour invalide/,
    );
    expect(() => validerRecommandation(recommandation({ confiance: 140 }))).toThrow(
      /Confiance/,
    );
    expect(() =>
      validerRecommandation(
        recommandation({
          facteurs: [{ code: "x", libelle: "X", impactPourcent: 500 }],
        }),
      ),
    ).toThrow(/Impact de facteur/);
    expect(() =>
      validerRecommandation(recommandation({ prixRecommandeCentimes: 0 })),
    ).toThrow(/Prix recommandé/);
  });

  it("choisit l'origine du prix appliqué dans le bon ordre", () => {
    expect(
      prixEffectif({ prixCatalogueCentimes: 12_000 }).origine,
    ).toBe("catalogue");
    expect(
      prixEffectif({
        prixCatalogueCentimes: 12_000,
        recommandationAppliqueeCentimes: 15_000,
      }),
    ).toEqual({ prixCentimes: 15_000, origine: "recommandation" });
    expect(
      prixEffectif({
        prixCatalogueCentimes: 12_000,
        recommandationAppliqueeCentimes: 15_000,
        overrideManuelCentimes: 18_000,
      }),
    ).toEqual({ prixCentimes: 18_000, origine: "override" });
  });

  it("résume les facteurs par impact décroissant", () => {
    expect(
      resumerFacteurs([
        { code: "w", libelle: "Week-end", impactPourcent: 12 },
        { code: "v", libelle: "Vacances", impactPourcent: -30 },
      ]),
    ).toBe("Vacances (-30 %) · Week-end (+12 %)");
    expect(resumerFacteurs([])).toBe("Aucun facteur communiqué.");
  });

  it("retient la source la plus confiante et ignore le bruit", () => {
    const retenue = recommandationARetenir([
      recommandation({ source: "local", confiance: 55 }),
      recommandation({ source: "partenaire", confiance: 88 }),
      recommandation({ source: "local", confiance: 12, prixRecommandeCentimes: 99_000 }),
    ]);
    expect(retenue?.source).toBe("partenaire");
    expect(retenue?.confiance).toBe(88);

    expect(
      recommandationARetenir([recommandation({ confiance: 20 })]),
    ).toBeNull();
    expect(recommandationARetenir([])).toBeNull();
  });

  it("énumère une plage tarifaire bornes incluses", () => {
    expect(joursInclus("2026-12-24", "2026-12-26")).toEqual([
      "2026-12-24",
      "2026-12-25",
      "2026-12-26",
    ]);
    expect(joursInclus("2026-12-24", "2026-12-24")).toEqual(["2026-12-24"]);
    expect(joursInclus("2026-12-26", "2026-12-24")).toEqual([]);
  });
});
