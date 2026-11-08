import { describe, expect, it } from "vitest";
import {
  LIBELLES_TYPE_VALIDATION,
  SEUIL_VALIDATION_CAUTION_CENTIMES,
  TYPES_SORTIE_ARGENT,
  estSortieArgent,
  validationRequise,
  validerSortieArgent,
} from "@/domain/validation-sensible";

describe("validation sensible", () => {
  it("garde le seuil de 300 € pour la caution", () => {
    expect(
      validationRequise("caution_retenue", SEUIL_VALIDATION_CAUTION_CENTIMES - 1),
    ).toBe(false);
    expect(
      validationRequise("caution_retenue", SEUIL_VALIDATION_CAUTION_CENTIMES),
    ).toBe(true);
    expect(validationRequise("caution_retenue", 0)).toBe(false);
  });

  it("exige la double validation pour toute sortie positive", () => {
    for (const type of TYPES_SORTIE_ARGENT) {
      expect(estSortieArgent(type)).toBe(true);
      expect(validationRequise(type, 1)).toBe(true);
      expect(validationRequise(type, 0)).toBe(false);
    }
    expect(estSortieArgent("caution_retenue")).toBe(false);
  });

  it("valide et normalise une sortie", () => {
    expect(
      validerSortieArgent({
        type: "geste_commercial",
        beneficiaire: "  Camille  ",
        montantCentimes: 2_500,
        motif: "  Dédommagement  ",
        reference: "  G-1  ",
      }),
    ).toEqual({
      type: "geste_commercial",
      beneficiaire: "Camille",
      montantCentimes: 2_500,
      motif: "Dédommagement",
      reference: "G-1",
    });
  });

  it("refuse un type de sortie inconnu", () => {
    expect(() =>
      validerSortieArgent({
        type: "caution_retenue",
        beneficiaire: "Camille",
        montantCentimes: 100,
        motif: "Motif",
      }),
    ).toThrowError(/type de sortie/);
  });

  it("libelle les quatre types de validation", () => {
    expect(Object.keys(LIBELLES_TYPE_VALIDATION)).toHaveLength(4);
  });
});
