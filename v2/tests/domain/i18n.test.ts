import { describe, expect, it } from "vitest";
import {
  LANGUES,
  dictionnaire,
  langueDepuisParam,
} from "@/lib/i18n";

describe("i18n voyageur", () => {
  it("retombe sur le français", () => {
    expect(langueDepuisParam(undefined)).toBe("fr");
    expect(langueDepuisParam("xx")).toBe("fr");
    expect(langueDepuisParam("EN")).toBe("en");
    expect(langueDepuisParam("de")).toBe("de");
  });

  it("fournit les mêmes clés dans les 5 langues", () => {
    const clesFr = Object.keys(dictionnaire("fr")).sort();
    for (const langue of LANGUES) {
      expect(Object.keys(dictionnaire(langue)).sort()).toEqual(clesFr);
    }
  });

  it("traduit les libellés et les statuts", () => {
    expect(dictionnaire("en").votreSejour).toBe("Your stay");
    expect(dictionnaire("it").votreSejour).toBe("Il tuo soggiorno");
    expect(dictionnaire("es").votreSejour).toBe("Tu estancia");
    expect(dictionnaire("de").votreSejour).toBe("Ihr Aufenthalt");
    expect(dictionnaire("en").statutsCommande.demandee).toBe("Requested");
    expect(dictionnaire("de").statutsIncident.en_cours).toBe(
      "In Bearbeitung",
    );
  });

  it("n’a aucun libellé vide", () => {
    for (const langue of LANGUES) {
      const d = dictionnaire(langue);
      for (const [cle, valeur] of Object.entries(d)) {
        if (typeof valeur === "string") {
          expect(valeur.trim().length, `${langue}.${cle}`).toBeGreaterThan(0);
        }
      }
    }
  });
});
