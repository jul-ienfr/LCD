import { describe, expect, it } from "vitest";
import {
  appliquerVariables,
  CATEGORIES_PHRASE,
  categoriePhraseValide,
  CONTENU_PHRASE_MAX,
  PHRASES_DEFAUT,
  refPhraseValide,
  TITRE_PHRASE_MAX,
  validerPhrase,
} from "@/domain/phrase";
import { ErreurMetier } from "@/domain/erreurs";

const variables = {
  voyageur: "Camille",
  logement: "Santa Severa",
  debut: "01/12/2026",
  fin: "05/12/2026",
  heure: "15:00",
};

describe("domaine phrase type", () => {
  it("valide la référence, la catégorie et les bornes", () => {
    expect(refPhraseValide("phrase-1234")).toBe(true);
    expect(refPhraseValide("ab")).toBe(false);
    expect(CATEGORIES_PHRASE).toHaveLength(4);
    expect(categoriePhraseValide("arrivee")).toBe(true);
    expect(categoriePhraseValide("pub")).toBe(false);
    expect(() =>
      validerPhrase({
        categorie: "arrivee",
        titre: "a",
        contenu: "Bonjour",
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerPhrase({
        categorie: "arrivee",
        titre: "a".repeat(TITRE_PHRASE_MAX + 1),
        contenu: "Bonjour",
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerPhrase({
        categorie: "pub",
        titre: "Titre",
        contenu: "Bonjour",
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerPhrase({
        categorie: "general",
        titre: "Titre",
        contenu: "a".repeat(CONTENU_PHRASE_MAX + 1),
      }),
    ).toThrow(ErreurMetier);
  });

  it("normalise les champs", () => {
    expect(
      validerPhrase({
        categorie: "depart",
        titre: "  Départ  ",
        contenu: "  Bon voyage  ",
      }),
    ).toEqual({
      categorie: "depart",
      titre: "Départ",
      contenu: "Bon voyage",
    });
  });

  it("remplace les variables connues et laisse les autres", () => {
    expect(
      appliquerVariables(
        "Bonjour {voyageur}, {logement} du {debut} au {fin} à {heure}.",
        variables,
      ),
    ).toBe(
      "Bonjour Camille, Santa Severa du 01/12/2026 au 05/12/2026 à 15:00.",
    );
    expect(
      appliquerVariables("{voyageur} et encore {voyageur} {inconnu}", variables),
    ).toBe("Camille et encore Camille {inconnu}");
    expect(appliquerVariables("Sans variable.", variables)).toBe(
      "Sans variable.",
    );
  });

  it("fournit quatre modèles prêts à l’emploi", () => {
    expect(PHRASES_DEFAUT).toHaveLength(4);
    for (const modele of PHRASES_DEFAUT) {
      expect(modele.contenu).toContain("{logement}");
    }
  });
});
