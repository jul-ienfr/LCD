import { describe, expect, it } from "vitest";
import {
  formaterTauxTva,
  montantTaxeSejour,
  montantTva,
  parametresFiscauxParDefaut,
  prefixeFactureValide,
  tauxTvaValide,
} from "@/domain/fiscal";

describe("fiscalité", () => {
  it("fournit des paramètres par défaut : TVA 10 %, sans taxe", () => {
    const parametres = parametresFiscauxParDefaut("tenant-1");
    expect(parametres.tauxTvaBp).toBe(1_000);
    expect(parametres.taxeSejourNuitPersonneCentimes).toBe(0);
    expect(parametres.taxeSejourPlafondCentimes).toBeNull();
    expect(parametres.prefixeFacture).toBe("FAC");
  });

  it("calcule la TVA au taux de 10 %", () => {
    expect(montantTva(84_000, 1_000)).toBe(8_400);
    expect(montantTva(12_345, 1_000)).toBe(1_235);
    expect(montantTva(10_000, 2_000)).toBe(2_000);
    expect(montantTva(0, 1_000)).toBe(0);
  });

  it("refuse un taux de TVA hors bornes", () => {
    expect(() => montantTva(10_000, -1)).toThrow();
    expect(() => montantTva(10_000, 10_001)).toThrow();
    expect(tauxTvaValide(1_000)).toBe(true);
    expect(tauxTvaValide(10_001)).toBe(false);
  });

  it("calcule la taxe de séjour par nuit et par personne", () => {
    expect(
      montantTaxeSejour({
        nuits: 3,
        voyageurs: 2,
        taxeSejourNuitPersonneCentimes: 150,
      }),
    ).toBe(900);
  });

  it("applique le plafond par nuit et par personne", () => {
    expect(
      montantTaxeSejour({
        nuits: 2,
        voyageurs: 4,
        taxeSejourNuitPersonneCentimes: 300,
        taxeSejourPlafondCentimes: 100,
      }),
    ).toBe(800);
  });

  it("accepte zéro nuit ou zéro voyageur", () => {
    expect(
      montantTaxeSejour({
        nuits: 0,
        voyageurs: 2,
        taxeSejourNuitPersonneCentimes: 150,
      }),
    ).toBe(0);
  });

  it("valide le préfixe de facture et formate le taux", () => {
    expect(prefixeFactureValide("FAC")).toBe(true);
    expect(prefixeFactureValide("SEJ-26")).toBe(false);
    expect(prefixeFactureValide("F")).toBe(false);
    expect(formaterTauxTva(1_000)).toContain("10");
  });
});
