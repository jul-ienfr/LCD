import { describe, expect, it } from "vitest";
import {
  COMMENTAIRE_MAX,
  moyenneAvis,
  noteAvisValide,
  validerAvis,
} from "@/domain/avis";
import { ErreurMetier } from "@/domain/erreurs";

describe("avis", () => {
  it("borne la note entre 1 et 5", () => {
    expect(noteAvisValide(1)).toBe(true);
    expect(noteAvisValide(5)).toBe(true);
    expect(noteAvisValide(0)).toBe(false);
    expect(noteAvisValide(6)).toBe(false);
    expect(noteAvisValide(3.5)).toBe(false);
    expect(noteAvisValide(Number.NaN)).toBe(false);
  });

  it("normalise le nom et le commentaire", () => {
    expect(
      validerAvis({ nom: "  Marie  ", note: 4, commentaire: "  Très bien  " }),
    ).toEqual({ nom: "Marie", note: 4, commentaire: "Très bien" });
    expect(validerAvis({ nom: "Marie", note: 5 }).commentaire).toBe("");
  });

  it("refuse un nom hors bornes", () => {
    expect(() => validerAvis({ nom: "A", note: 5 })).toThrow(ErreurMetier);
    expect(() => validerAvis({ nom: "a".repeat(81), note: 5 })).toThrow(
      ErreurMetier,
    );
    expect(() => validerAvis({ nom: "a".repeat(80), note: 5 })).not.toThrow();
  });

  it("refuse une note invalide", () => {
    expect(() => validerAvis({ nom: "Marie", note: 0 })).toThrow(ErreurMetier);
    expect(() => validerAvis({ nom: "Marie", note: 9 })).toThrow(ErreurMetier);
  });

  it("borne le commentaire", () => {
    const long = "a".repeat(COMMENTAIRE_MAX);
    expect(() =>
      validerAvis({ nom: "Marie", note: 5, commentaire: long }),
    ).not.toThrow();
    expect(() =>
      validerAvis({ nom: "Marie", note: 5, commentaire: `${long}a` }),
    ).toThrow(ErreurMetier);
  });

  it("calcule la moyenne arrondie au dixième", () => {
    expect(moyenneAvis([])).toBeNull();
    expect(moyenneAvis([5])).toBe(5);
    expect(moyenneAvis([5, 4])).toBe(4.5);
    expect(moyenneAvis([5, 4, 4])).toBe(4.3);
  });
});
