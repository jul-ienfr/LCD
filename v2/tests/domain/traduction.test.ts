import { describe, expect, it } from "vitest";
import { ErreurMetier } from "@/domain/erreurs";
import {
  construireInviteTraduction,
  langueTraductionValide,
  normaliserLangue,
  TRADUCTION_CARACTERES_MAX,
  verifierTraduction,
} from "@/domain/traduction";

describe("domaine traduction", () => {
  it("valide et normalise les six langues", () => {
    for (const langue of ["fr", "en", "es", "it", "de", "nl"]) {
      expect(langueTraductionValide(langue)).toBe(true);
      expect(normaliserLangue(langue)).toBe(langue);
    }
    expect(langueTraductionValide("pt")).toBe(false);
    expect(normaliserLangue("PT")).toBe("fr");
    expect(normaliserLangue(null)).toBe("fr");
  });

  it("construit une invite fidèle sans ajouter de consignes métier", () => {
    const invite = construireInviteTraduction({
      texte: "Bonjour, à quelle heure peut-on arriver ?",
      de: "fr",
      vers: "en",
    });
    expect(invite).toContain("du français vers l’anglais");
    expect(invite).toContain("Bonjour, à quelle heure peut-on arriver ?");
    expect(invite).toContain("Réponds uniquement par la traduction");
  });

  it("refuse un texte vide, trop long ou porteur d'un code d'accès", () => {
    expect(() =>
      construireInviteTraduction({ texte: " ", de: "fr", vers: "en" }),
    ).toThrow(ErreurMetier);
    expect(() =>
      construireInviteTraduction({
        texte: "a".repeat(TRADUCTION_CARACTERES_MAX + 1),
        de: "fr",
        vers: "en",
      }),
    ).toThrow(/limité/);
    expect(() =>
      construireInviteTraduction({
        texte: "Le code d’accès est 4821.",
        de: "fr",
        vers: "en",
      }),
    ).toThrow(/code d’accès/);
  });

  it("vérifie la sortie du modèle", () => {
    expect(verifierTraduction("Hello")).toEqual([]);
    expect(verifierTraduction("")).toContain("La traduction est vide.");
    expect(verifierTraduction("Code PIN 1234")).toContain(
      "La traduction contient un code d’accès.",
    );
  });
});
