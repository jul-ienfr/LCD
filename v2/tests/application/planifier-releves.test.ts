import { describe, expect, it } from "vitest";
import {
  estPremierJourDuMois,
  estPremierJourDuTrimestre,
  proprietairesDistincts,
  selectionnerRelevesAGenerer,
} from "@/application/use-cases/planifier-releves";

describe("planifier-releves — sélection pure", () => {
  describe("estPremierJourDuMois", () => {
    it("détecte le premier jour du mois", () => {
      expect(estPremierJourDuMois("2026-03-01")).toBe(true);
      expect(estPremierJourDuMois("2026-12-01")).toBe(true);
    });
    it("rejette les autres jours", () => {
      expect(estPremierJourDuMois("2026-03-02")).toBe(false);
      expect(estPremierJourDuMois("2026-03-15")).toBe(false);
      expect(estPremierJourDuMois("2026-03-31")).toBe(false);
    });
  });

  describe("estPremierJourDuTrimestre", () => {
    it("détecte les premiers jours de trimestre", () => {
      expect(estPremierJourDuTrimestre("2026-01-01")).toBe(true);
      expect(estPremierJourDuTrimestre("2026-04-01")).toBe(true);
      expect(estPremierJourDuTrimestre("2026-07-01")).toBe(true);
      expect(estPremierJourDuTrimestre("2026-10-01")).toBe(true);
    });
    it("rejette les premiers jours des autres mois", () => {
      expect(estPremierJourDuTrimestre("2026-02-01")).toBe(false);
      expect(estPremierJourDuTrimestre("2026-03-01")).toBe(false);
      expect(estPremierJourDuTrimestre("2026-05-01")).toBe(false);
    });
    it("rejette les jours non premiers", () => {
      expect(estPremierJourDuTrimestre("2026-01-02")).toBe(false);
    });
  });

  describe("selectionnerRelevesAGenerer", () => {
    it("ne retourne rien un jour qui n'est pas le 1er", () => {
      expect(selectionnerRelevesAGenerer("2026-03-15")).toEqual([]);
      expect(selectionnerRelevesAGenerer("2026-03-31")).toEqual([]);
    });
    it("retourne le relevé mensuel du mois précédent le 1er", () => {
      const result = selectionnerRelevesAGenerer("2026-03-01", ["mensuel"]);
      expect(result).toEqual([{ moisDebut: "2026-02", periode: "mensuel" }]);
    });
    it("retourne le relevé trimestriel du trimestre précédent le 1er d'un trimestre", () => {
      const result = selectionnerRelevesAGenerer("2026-04-01", ["trimestriel"]);
      expect(result).toEqual([{ moisDebut: "2026-01", periode: "trimestriel" }]);
    });
    it("retourne les deux relevés le 1er d'un trimestre quand les deux sont activés", () => {
      const result = selectionnerRelevesAGenerer("2026-07-01", ["mensuel", "trimestriel"]);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ moisDebut: "2026-06", periode: "mensuel" });
      expect(result).toContainEqual({ moisDebut: "2026-04", periode: "trimestriel" });
    });
    it("ne retourne que le mensuel le 1er d'un mois non-trimestre", () => {
      const result = selectionnerRelevesAGenerer("2026-05-01", ["mensuel", "trimestriel"]);
      expect(result).toEqual([{ moisDebut: "2026-04", periode: "mensuel" }]);
    });
    it("gère le passage d'année pour le mensuel", () => {
      const result = selectionnerRelevesAGenerer("2027-01-01", ["mensuel"]);
      expect(result).toEqual([{ moisDebut: "2026-12", periode: "mensuel" }]);
    });
    it("gère le passage d'année pour le trimestriel", () => {
      const result = selectionnerRelevesAGenerer("2027-01-01", ["trimestriel"]);
      expect(result).toEqual([{ moisDebut: "2026-10", periode: "trimestriel" }]);
    });
  });

  describe("proprietairesDistincts", () => {
    it("dédoublonne les propriétaires par identifiant", () => {
      const mandats = [
        { proprietaireId: "u1", proprietaireNom: "Jean" },
        { proprietaireId: "u1", proprietaireNom: "Jean" },
        { proprietaireId: "u2", proprietaireNom: "Marie" },
      ];
      expect(proprietairesDistincts(mandats)).toEqual([
        { proprietaireId: "u1", proprietaireNom: "Jean", proprietaireEmail: null },
        { proprietaireId: "u2", proprietaireNom: "Marie", proprietaireEmail: null },
      ]);
    });
    it("retourne un tableau vide sans mandat", () => {
      expect(proprietairesDistincts([])).toEqual([]);
    });
  });
});
