/**
 * Règles de reconnaissance des données de recette (`scripts/lib/donnees-recette.mjs`)
 * et cohérence de l'ordre de purge avec l'outil qui l'exécute.
 *
 * Test en `.mjs` à dessein : la bibliothèque testée est un module `.mjs` sans
 * déclaration de types, et Vitest ramasse aussi les `.test.mjs`.
 */
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  CONSERVER_EMAIL_DEFAUT,
  ETAPES,
  estCompteDeRecette,
  estLogementDeRecette,
  nomBaseRessembleARecette,
  ordreEtapes,
} from "../scripts/lib/donnees-recette.mjs";

describe("logements de recette", () => {
  it("conserve les trois logements de vitrine, par code", () => {
    expect(estLogementDeRecette({ code: "villa-santa-severa", nom: "Villa Santa Severa" })).toBe(false);
    expect(estLogementDeRecette({ code: "mas-des-oliviers", nom: "Le Mas des Oliviers" })).toBe(false);
    expect(estLogementDeRecette({ code: "loft-du-port", nom: "Le Loft du Port" })).toBe(false);
  });

  it("reconnaît la vitrine même sans code, par son nom", () => {
    expect(estLogementDeRecette({ code: null, nom: "Villa Santa Severa" })).toBe(false);
    expect(estLogementDeRecette({ nom: "  Le Loft du Port  " })).toBe(false);
  });

  it("tolère la casse et les espaces sur le code", () => {
    expect(estLogementDeRecette({ code: "  VILLA-SANTA-SEVERA ", nom: "x" })).toBe(false);
  });

  it("classe en recette toutes les fixtures rencontrées en base", () => {
    for (const nom of [
      "Direct E2E 1794531851584",
      "Onboarding 1794539963531",
      "Logement plan 1794594021768",
      "Logement dérivé 1794570519397",
      "Logement Archive 1794542651847",
      "Relevé 1794566147411",
      "Import 1794601588958",
      "Proprio A 1794566147412",
      "Diag12 1794541793358",
    ]) {
      expect(estLogementDeRecette({ code: `fixture-${nom}`, nom }), nom).toBe(true);
    }
  });

  it("ne classe pas en recette un logement sans nom ni code de vitrine", () => {
    expect(estLogementDeRecette({ code: null, nom: "" })).toBe(true);
    expect(estLogementDeRecette({})).toBe(true);
  });
});

describe("comptes de recette", () => {
  it("conserve le compte administrateur de la démonstration", () => {
    expect(estCompteDeRecette(CONSERVER_EMAIL_DEFAUT)).toBe(false);
    expect(estCompteDeRecette("SUPER@LCD.TEST")).toBe(false);
  });

  it("reconnaît les domaines de test", () => {
    expect(estCompteDeRecette("hote1@lcd.test")).toBe(true);
    expect(estCompteDeRecette("camille.ergonomie@example.test")).toBe(true);
    expect(estCompteDeRecette("x@example.com")).toBe(true);
    expect(estCompteDeRecette("x@test")).toBe(true);
    expect(estCompteDeRecette("x@localhost")).toBe(true);
  });

  it("ne touche jamais à une adresse réelle", () => {
    expect(estCompteDeRecette("patron@lcd.fr")).toBe(false);
    expect(estCompteDeRecette("contact@location-courte-duree.fr")).toBe(false);
    expect(estCompteDeRecette("")).toBe(false);
    expect(estCompteDeRecette(null)).toBe(false);
  });

  it("respecte un compte conservé sur mesure", () => {
    expect(estCompteDeRecette("admin@lcd.test", "admin@lcd.test")).toBe(false);
    expect(estCompteDeRecette("hote@lcd.test", "admin@lcd.test")).toBe(true);
  });
});

describe("nom de base", () => {
  it("autorise les bases de recette", () => {
    for (const nom of ["lcd_demo", "lcd_test", "lcd_recette", "lcd_dev", "lcd_staging", "lcd_preprod", "LCD_DEMO"]) {
      expect(nomBaseRessembleARecette(nom), nom).toBe(true);
    }
  });

  it("exige un forçage sur une base qui ne l'est pas", () => {
    for (const nom of ["lcd", "lcd_prod", "production", ""]) {
      expect(nomBaseRessembleARecette(nom), nom).toBe(false);
    }
  });
});

describe("ordre de purge", () => {
  it("supprime les tables RESTRICT avant leurs parents", () => {
    const ordre = ordreEtapes();
    // factures et reservations bloquent la suppression d'un logement (RESTRICT)
    expect(ordre.indexOf("factures")).toBeLessThan(ordre.indexOf("logements"));
    expect(ordre.indexOf("reservations")).toBeLessThan(ordre.indexOf("logements"));
    // dispatches et missions bloquent la suppression d'un compte (RESTRICT)
    expect(ordre.indexOf("dispatches")).toBeLessThan(ordre.indexOf("comptes"));
    expect(ordre.indexOf("missions")).toBeLessThan(ordre.indexOf("comptes"));
    // les logements ne partent qu'une fois les comptes traités
    expect(ordre.indexOf("comptes")).toBeLessThan(ordre.indexOf("logements"));
  });

  it("n'a ni doublon ni étape sans table", () => {
    const ordre = ordreEtapes();
    expect(new Set(ordre).size).toBe(ordre.length);
    for (const etape of ETAPES) {
      expect(typeof etape.table).toBe("string");
      expect(etape.table.length).toBeGreaterThan(0);
      expect(typeof etape.description).toBe("string");
    }
  });

  it("reste aligné sur l'outil qui exécute la purge", async () => {
    const source = await readFile("scripts/nettoyer-donnees-recette.mjs", "utf8");
    const ids = [...source.matchAll(/id: "([a-z]+)",\n\s+compter/g)].map((m) => m[1]);
    expect(ids).toEqual(ordreEtapes());
  });
});