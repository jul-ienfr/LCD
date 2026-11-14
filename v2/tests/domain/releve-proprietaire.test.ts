import { describe, expect, it } from "vitest";
import {
  calculerAggregats,
  calculerLigneReleve,
  calculerMixCanal,
  construireReleve,
  moisReleveValide,
  periodeReleveValide,
} from "@/domain/releve-proprietaire";

describe("releve-proprietaire — validation", () => {
  it("moisReleveValide accepte un format AAAA-MM", () => {
    expect(moisReleveValide("2026-01")).toBe(true);
    expect(moisReleveValide("2026-12")).toBe(true);
  });

  it("moisReleveValide refuse un format invalide", () => {
    expect(moisReleveValide("2026-13")).toBe(false);
    expect(moisReleveValide("2026")).toBe(false);
    expect(moisReleveValide("janvier")).toBe(false);
  });

  it("periodeReleveValide valide un mois unique pour mensuel", () => {
    expect(periodeReleveValide("2026-03", "2026-03", "mensuel")).toBe(true);
  });

  it("periodeReleveValide refuse des mois différents pour mensuel", () => {
    expect(periodeReleveValide("2026-03", "2026-04", "mensuel")).toBe(false);
  });

  it("periodeReleveValide valide un trimestre", () => {
    expect(periodeReleveValide("2026-01", "2026-03", "trimestriel")).toBe(true);
    expect(periodeReleveValide("2026-10", "2026-12", "trimestriel")).toBe(true);
  });

  it("periodeReleveValide refuse un trimestre incorrect", () => {
    expect(periodeReleveValide("2026-01", "2026-02", "trimestriel")).toBe(false);
    expect(periodeReleveValide("2026-01", "2026-04", "trimestriel")).toBe(false);
  });
});

describe("releve-proprietaire — calculerLigneReleve", () => {
  const base = {
    logementId: "log-1",
    logementNom: "Villa Test",
    moisDebut: "2026-03",
    moisFin: "2026-03",
    commissionBp: 2_000, // 20 %
    chargesMensuellesCentimes: 5_000,
  };

  it("calcule CA, commission, charges et net pour des réservations valides", () => {
    const ligne = calculerLigneReleve({
      ...base,
      reservations: [
        {
          montantCentimes: 100_000,
          statut: "confirmee",
          debut: "2026-03-05",
          fin: "2026-03-10",
        },
        {
          montantCentimes: 50_000,
          statut: "en_sejour",
          debut: "2026-03-15",
          fin: "2026-03-18",
        },
      ],
    });

    expect(ligne.caCentimes).toBe(150_000);
    expect(ligne.commissionCentimes).toBe(30_000); // 20 % de 150 000
    expect(ligne.chargesCentimes).toBe(5_000);
    expect(ligne.netCentimes).toBe(115_000); // 150k - 30k - 5k
    expect(ligne.sejours).toBe(2);
  });

  it("ignore les réservations annulées", () => {
    const ligne = calculerLigneReleve({
      ...base,
      reservations: [
        {
          montantCentimes: 100_000,
          statut: "confirmee",
          debut: "2026-03-05",
          fin: "2026-03-10",
        },
        {
          montantCentimes: 80_000,
          statut: "annulee",
          debut: "2026-03-12",
          fin: "2026-03-14",
        },
      ],
    });

    expect(ligne.caCentimes).toBe(100_000);
    expect(ligne.sejours).toBe(1);
  });

  it("ignore les réservations hors période", () => {
    const ligne = calculerLigneReleve({
      ...base,
      reservations: [
        {
          montantCentimes: 100_000,
          statut: "confirmee",
          debut: "2026-03-05",
          fin: "2026-03-10",
        },
        {
          montantCentimes: 60_000,
          statut: "confirmee",
          debut: "2026-04-01",
          fin: "2026-04-05",
        },
      ],
    });

    expect(ligne.caCentimes).toBe(100_000);
    expect(ligne.sejours).toBe(1);
  });

  it("multiplie les charges par le nombre de mois pour un trimestre", () => {
    const ligne = calculerLigneReleve({
      ...base,
      moisDebut: "2026-01",
      moisFin: "2026-03",
      reservations: [
        {
          montantCentimes: 90_000,
          statut: "confirmee",
          debut: "2026-02-10",
          fin: "2026-02-15",
        },
      ],
    });

    expect(ligne.chargesCentimes).toBe(15_000); // 5 000 × 3 mois
  });

  it("retourne zéro pour un logement sans réservation", () => {
    const ligne = calculerLigneReleve({
      ...base,
      reservations: [],
    });

    expect(ligne.caCentimes).toBe(0);
    expect(ligne.commissionCentimes).toBe(0);
    expect(ligne.chargesCentimes).toBe(5_000);
    expect(ligne.netCentimes).toBe(-5_000);
    expect(ligne.sejours).toBe(0);
  });
});

describe("releve-proprietaire — construireReleve", () => {
  it("agrège les totaux des lignes", () => {
    const lignes = [
      {
        logementId: "log-1",
        logementNom: "Villa A",
        sejours: 2,
        caCentimes: 100_000,
        commissionCentimes: 20_000,
        chargesCentimes: 5_000,
        netCentimes: 75_000,
      },
      {
        logementId: "log-2",
        logementNom: "Villa B",
        sejours: 1,
        caCentimes: 50_000,
        commissionCentimes: 10_000,
        chargesCentimes: 3_000,
        netCentimes: 37_000,
      },
    ];

    const releve = construireReleve({
      id: "rel-1",
      tenantId: "tenant-1",
      proprietaireId: "user-1",
      proprietaireNom: "Jean Dupont",
      moisDebut: "2026-03",
      moisFin: "2026-03",
      periode: "mensuel",
      lignes,
    });

    expect(releve.totalCaCentimes).toBe(150_000);
    expect(releve.totalCommissionCentimes).toBe(30_000);
    expect(releve.totalChargesCentimes).toBe(8_000);
    expect(releve.totalNetCentimes).toBe(112_000);
    expect(releve.genereAt).toBeTruthy();
  });

  it("rejette une période invalide", () => {
    expect(() =>
      construireReleve({
        id: "rel-1",
        tenantId: "tenant-1",
        proprietaireId: "user-1",
        proprietaireNom: "Jean",
        moisDebut: "2026-01",
        moisFin: "2026-02",
        periode: "trimestriel",
        lignes: [],
      }),
    ).toThrow("Période de relevé invalide");
  });
});

describe("releve-proprietaire — agrégats KPI", () => {
  it("calcule occupation, ADR et RevPAR", () => {
    const agg = calculerAggregats({
      logements: 2,
      moisDebut: "2026-03",
      moisFin: "2026-03",
      reservations: [
        { nuits: 10, montantCentimes: 100_000 },
        { nuits: 5, montantCentimes: 50_000 },
      ],
    });

    expect(agg.nuitsReservees).toBe(15);
    expect(agg.nuitsDisponibles).toBe(62); // 2 logements × 31 jours
    expect(agg.tauxOccupation).toBeCloseTo(15 / 62, 4);
    expect(agg.adrCentimes).toBe(10_000); // 150 000 / 15 nuits
    expect(agg.revparCentimes).toBe(Math.round(150_000 / 62));
  });

  it("retourne zéro sans réservation", () => {
    const agg = calculerAggregats({
      logements: 1,
      moisDebut: "2026-03",
      moisFin: "2026-03",
      reservations: [],
    });

    expect(agg.tauxOccupation).toBe(0);
    expect(agg.adrCentimes).toBe(0);
    expect(agg.revparCentimes).toBe(0);
  });
});

describe("releve-proprietaire — mix canal", () => {
  it("répartit le CA par canal et trie par CA décroissant", () => {
    const mix = calculerMixCanal([
      { canal: "airbnb", montantCentimes: 60_000 },
      { canal: "booking", montantCentimes: 40_000 },
      { canal: "airbnb", montantCentimes: 20_000 },
      { canal: "direct", montantCentimes: 30_000 },
    ]);

    expect(mix).toHaveLength(3);
    // Airbnb : 80 000, Booking : 40 000, Direct : 30 000
    expect(mix[0]!.canal).toBe("airbnb");
    expect(mix[0]!.caCentimes).toBe(80_000);
    expect(mix[0]!.reservations).toBe(2);
    expect(mix[0]!.partCa).toBeCloseTo(80 / 150, 4);

    expect(mix[1]!.canal).toBe("booking");
    expect(mix[1]!.caCentimes).toBe(40_000);

    expect(mix[2]!.canal).toBe("direct");
    expect(mix[2]!.caCentimes).toBe(30_000);
  });

  it("retourne un tableau vide sans réservation", () => {
    expect(calculerMixCanal([])).toEqual([]);
  });
});
