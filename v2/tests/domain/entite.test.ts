import { describe, expect, it } from "vitest";
import {
  adresseEntiteValide,
  mentionsEntiteValides,
  natureEntiteValide,
  nomEntiteValide,
  regimeEntiteValide,
  sirenValide,
  tvaEntiteValide,
} from "@/domain/entite";

describe("entité juridique", () => {
  it("valide les enums fermées", () => {
    expect(natureEntiteValide("sci_IS")).toBe(true);
    expect(natureEntiteValide("sci")).toBe(false);
    expect(regimeEntiteValide("is_2065")).toBe(true);
    expect(regimeEntiteValide("forfait")).toBe(false);
    expect(tvaEntiteValide("franchise")).toBe(true);
    expect(tvaEntiteValide("exonere")).toBe(false);
  });

  it("valide le nom, le SIREN et les textes", () => {
    expect(nomEntiteValide("LCD Parc")).toBe(true);
    expect(nomEntiteValide(" ")).toBe(false);
    expect(sirenValide(null)).toBe(true);
    expect(sirenValide("123456789")).toBe(true);
    expect(sirenValide("12345678")).toBe(false);
    expect(sirenValide("12345678A")).toBe(false);
    expect(adresseEntiteValide("12 rue des Lilas")).toBe(true);
    expect(adresseEntiteValide("x".repeat(501))).toBe(false);
    expect(mentionsEntiteValides("TVA non applicable")).toBe(true);
    expect(mentionsEntiteValides("x".repeat(2_001))).toBe(false);
  });
});
