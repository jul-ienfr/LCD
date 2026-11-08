import { describe, expect, it } from "vitest";
import {
  construireEcheancier,
  remboursementAnnulation,
} from "@/domain/echeancier";
import { ErreurMetier } from "@/domain/erreurs";

const MAINTENANT = new Date("2026-11-06T10:00:00Z");
const ARRIVEE = new Date("2027-01-10T00:00:00Z");

describe("construireEcheancier", () => {
  it("calcule un acompte de 30 % et un solde exact", () => {
    const echeancier = construireEcheancier({
      totalSejourCentimes: 100_000,
      arrivee: ARRIVEE,
      maintenant: MAINTENANT,
      acomptePourcent: 30,
      joursSoldeAvantArrivee: 30,
    });

    expect(echeancier.acompte.montantCentimes).toBe(30_000);
    expect(echeancier.solde.montantCentimes).toBe(70_000);
    expect(echeancier.acompte.exigibleLe).toEqual(MAINTENANT);
    expect(echeancier.solde.exigibleLe.toISOString()).toBe(
      "2026-12-11T00:00:00.000Z",
    );
    expect(
      echeancier.acompte.montantCentimes + echeancier.solde.montantCentimes,
    ).toBe(100_000);
  });

  it("absorbe l'arrondi dans le solde", () => {
    const echeancier = construireEcheancier({
      totalSejourCentimes: 10_000,
      arrivee: ARRIVEE,
      maintenant: MAINTENANT,
      acomptePourcent: 33,
      joursSoldeAvantArrivee: 30,
    });
    expect(echeancier.acompte.montantCentimes).toBe(3_300);
    expect(echeancier.solde.montantCentimes).toBe(6_700);
  });

  it("marque l'acompte payé quand le pourcentage vaut 0", () => {
    const echeancier = construireEcheancier({
      totalSejourCentimes: 50_000,
      arrivee: ARRIVEE,
      maintenant: MAINTENANT,
      acomptePourcent: 0,
      joursSoldeAvantArrivee: 30,
    });
    expect(echeancier.acompte.montantCentimes).toBe(0);
    expect(echeancier.acompte.statut).toBe("paye");
    expect(echeancier.solde.montantCentimes).toBe(50_000);
  });

  it("marque le solde payé quand l'acompte vaut 100 %", () => {
    const echeancier = construireEcheancier({
      totalSejourCentimes: 50_000,
      arrivee: ARRIVEE,
      maintenant: MAINTENANT,
      acomptePourcent: 100,
      joursSoldeAvantArrivee: 30,
    });
    expect(echeancier.solde.montantCentimes).toBe(0);
    expect(echeancier.solde.statut).toBe("paye");
  });

  it("rend le solde immédiat si la date est passée", () => {
    const echeancier = construireEcheancier({
      totalSejourCentimes: 50_000,
      arrivee: new Date("2026-11-10T00:00:00Z"),
      maintenant: MAINTENANT,
      acomptePourcent: 30,
      joursSoldeAvantArrivee: 30,
    });
    expect(echeancier.solde.exigibleLe).toEqual(MAINTENANT);
  });

  it("ajoute une caution exigible à l'arrivée", () => {
    const echeancier = construireEcheancier({
      totalSejourCentimes: 80_000,
      arrivee: ARRIVEE,
      maintenant: MAINTENANT,
      acomptePourcent: 25,
      joursSoldeAvantArrivee: 30,
      cautionCentimes: 50_000,
    });
    expect(echeancier.caution?.montantCentimes).toBe(50_000);
    expect(echeancier.caution?.exigibleLe).toEqual(ARRIVEE);
  });

  it("refuse un total nul ou négatif", () => {
    expect(() =>
      construireEcheancier({
        totalSejourCentimes: 0,
        arrivee: ARRIVEE,
        acomptePourcent: 30,
        joursSoldeAvantArrivee: 30,
      }),
    ).toThrow(ErreurMetier);
  });

  it("refuse un pourcentage hors bornes", () => {
    expect(() =>
      construireEcheancier({
        totalSejourCentimes: 10_000,
        arrivee: ARRIVEE,
        acomptePourcent: 101,
        joursSoldeAvantArrivee: 30,
      }),
    ).toThrow("pourcentage");
  });

  it("refuse un délai de solde invalide", () => {
    expect(() =>
      construireEcheancier({
        totalSejourCentimes: 10_000,
        arrivee: ARRIVEE,
        acomptePourcent: 30,
        joursSoldeAvantArrivee: -1,
      }),
    ).toThrow("délai");
  });
});

describe("remboursementAnnulation", () => {
  const politique = {
    paliers: [
      { joursAvantMin: 30, pourcentageRembourse: 100 },
      { joursAvantMin: 7, pourcentageRembourse: 50 },
      { joursAvantMin: 0, pourcentageRembourse: 0 },
    ],
  };

  it("rembourse intégralement à 30 jours ou plus", () => {
    expect(remboursementAnnulation(100_000, 30, politique)).toBe(100_000);
  });

  it("rembourse 50 % entre 7 et 29 jours", () => {
    expect(remboursementAnnulation(100_000, 7, politique)).toBe(50_000);
    expect(remboursementAnnulation(100_000, 29, politique)).toBe(50_000);
  });

  it("ne rembourse rien sous 7 jours", () => {
    expect(remboursementAnnulation(100_000, 6, politique)).toBe(0);
  });

  it("déduit des frais fixes sans passer sous zéro", () => {
    expect(
      remboursementAnnulation(100_000, 30, {
        ...politique,
        fraisFixeCentimes: 2_500,
      }),
    ).toBe(97_500);
    expect(
      remboursementAnnulation(1_000, 30, {
        ...politique,
        fraisFixeCentimes: 5_000,
      }),
    ).toBe(0);
  });

  it("plafonne au montant payé", () => {
    expect(
      remboursementAnnulation(10_000, 60, {
        paliers: [{ joursAvantMin: 0, pourcentageRembourse: 150 }],
      }),
    ).toBe(10_000);
  });

  it("refuse une politique vide", () => {
    expect(() =>
      remboursementAnnulation(10_000, 10, { paliers: [] }),
    ).toThrow("politique");
  });
});
