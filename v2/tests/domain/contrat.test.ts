import { describe, expect, it } from "vitest";
import {
  CLAUSES_CONTRAT,
  construireContrat,
} from "@/domain/contrat";
import { ErreurMetier } from "@/domain/erreurs";

const base = {
  refReservation: "resa-1",
  hoteNom: "LCD Conciergerie",
  hoteAdresse: "12 rue des Palmiers, 06700 Saint-Laurent-du-Var",
  hoteEmail: "contact@lcd.test",
  voyageurNom: "Camille Martin",
  voyageurEmail: "camille@example.test",
  logementNom: "Santa Severa",
  logementAdresse: "4 avenue du Port",
  debut: "2026-12-01",
  fin: "2026-12-05",
  voyageurs: 2,
  montantCentimes: 50_000,
  cautionCentimes: 30_000,
};

describe("domaine contrat de séjour", () => {
  it("construit un contrat complet", () => {
    const contrat = construireContrat(base);
    expect(contrat.reference).toBe("CT-resa-1");
    expect(contrat.hote.nom).toBe("LCD Conciergerie");
    expect(contrat.voyageur.nom).toBe("Camille Martin");
    expect(contrat.logement.nom).toBe("Santa Severa");
    expect(contrat.sejour).toEqual({
      debut: "2026-12-01",
      fin: "2026-12-05",
      nuits: 4,
      voyageurs: 2,
    });
    expect(contrat.montantCentimes).toBe(50_000);
    expect(contrat.cautionCentimes).toBe(30_000);
    expect(contrat.clauses).toBe(CLAUSES_CONTRAT);
  });

  it("tolère les champs absents", () => {
    const contrat = construireContrat({
      ...base,
      voyageurNom: null,
      voyageurEmail: null,
      hoteAdresse: null,
      hoteEmail: null,
      logementAdresse: null,
      cautionCentimes: null,
    });
    expect(contrat.voyageur).toEqual({ nom: "Voyageur", email: null });
    expect(contrat.hote.adresse).toBeNull();
    expect(contrat.logement.adresse).toBeNull();
    expect(contrat.cautionCentimes).toBeNull();
  });

  it("refuse les séjours incohérents", () => {
    expect(() =>
      construireContrat({ ...base, fin: "2026-12-01" }),
    ).toThrow(ErreurMetier);
    expect(() =>
      construireContrat({ ...base, debut: "01/12/2026" }),
    ).toThrow(ErreurMetier);
    expect(() => construireContrat({ ...base, refReservation: "  " })).toThrow(
      ErreurMetier,
    );
  });

  it("refuse les nombres invalides", () => {
    expect(() => construireContrat({ ...base, voyageurs: 0 })).toThrow(
      ErreurMetier,
    );
    expect(() => construireContrat({ ...base, voyageurs: 31 })).toThrow(
      ErreurMetier,
    );
    expect(() => construireContrat({ ...base, montantCentimes: -1 })).toThrow(
      ErreurMetier,
    );
    expect(() => construireContrat({ ...base, cautionCentimes: -1 })).toThrow(
      ErreurMetier,
    );
  });
});
