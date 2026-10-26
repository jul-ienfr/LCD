import { describe, expect, it } from "vitest";
import type { Paiement } from "@/domain/paiement";
import {
  alerteEcart,
  montantCentimes,
  orphelinesAnciennes,
  parseCsvBanque,
  periodeReleve,
  rapprocher,
} from "@/domain/rapprochement";

function paiement(overrides: Partial<Paiement> = {}): Paiement {
  return {
    id: crypto.randomUUID(),
    tenantId: "t1",
    factureId: "f1",
    ref: "PAY-0001",
    montantCentimes: 45000,
    mode: "virement",
    datePaiement: "2026-10-14",
    reference: "VIR-2026-001",
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("CSV bancaire", () => {
  it("lit un montant signé avec virgule et espaces", () => {
    expect(montantCentimes("1 234,56")).toBe(123456);
    expect(montantCentimes("-32,50")).toBe(-3250);
    expect(montantCentimes("(12,00)")).toBe(-1200);
    expect(montantCentimes("12.5")).toBe(1250);
    expect(montantCentimes("abc")).toBeNull();
  });

  it("parse l'en-tête français, les dates et les guillemets", () => {
    const resultat = parseCsvBanque(
      [
        "Date;Libellé;Montant;Référence",
        '15/10/2026;"VIR Client; DUPONT";450,00;VIR-2026-001',
        "16/10/2026;PRLV Charges;-32,50;",
      ].join("\n"),
    );
    expect(resultat.erreurs).toEqual([]);
    expect(resultat.lignes).toEqual([
      {
        dateOperation: "2026-10-15",
        libelle: "VIR Client; DUPONT",
        montantCentimes: 45000,
        reference: "VIR-2026-001",
      },
      {
        dateOperation: "2026-10-16",
        libelle: "PRLV Charges",
        montantCentimes: -3250,
        reference: null,
      },
    ]);
    expect(periodeReleve(resultat.lignes)).toEqual({
      debut: "2026-10-15",
      fin: "2026-10-16",
    });
  });

  it("accepte les colonnes débit et crédit séparées", () => {
    const resultat = parseCsvBanque(
      [
        "date,libelle,debit,credit",
        "2026-10-15,Encaissement,,780.00",
        "2026-10-16,Frais,12.50,",
      ].join("\n"),
    );
    expect(resultat.erreurs).toEqual([]);
    expect(resultat.lignes.map((ligne) => ligne.montantCentimes)).toEqual([
      78000, -1250,
    ]);
  });

  it("rejette les lignes invalides sans import partiel", () => {
    const resultat = parseCsvBanque(
      [
        "date;libelle;montant",
        "15/10/2026;OK;10,00",
        "31/02/2026;Date impossible;10,00",
        "16/10/2026;;10,00",
        "17/10/2026;Montant;abc",
      ].join("\n"),
    );
    expect(resultat.lignes).toHaveLength(1);
    expect(resultat.erreurs.map((erreur) => erreur.ligne)).toEqual([3, 4, 5]);
  });

  it("refuse un en-tête incomplet", () => {
    const resultat = parseCsvBanque("date;libelle\n15/10/2026;X");
    expect(resultat.lignes).toEqual([]);
    expect(resultat.erreurs[0]?.message).toContain("En-tête attendu");
  });
});

describe("rapprochement", () => {
  it("rapproche par montant, date et référence puis signale les orphelines", () => {
    const attendu = paiement();
    const resultat = rapprocher(
      [
        {
          dateOperation: "2026-10-15",
          libelle: "VIR VIR-2026-001 DUPONT",
          montantCentimes: 45000,
          reference: null,
        },
        {
          dateOperation: "2026-10-16",
          libelle: "ESPECES DIVERS",
          montantCentimes: 10000,
          reference: null,
        },
        {
          dateOperation: "2026-10-17",
          libelle: "FRAIS BANCAIRES",
          montantCentimes: -3250,
          reference: null,
        },
      ],
      [attendu],
    );

    expect(resultat.lignes.map((ligne) => ligne.statut)).toEqual([
      "rapproche",
      "orpheline",
      "ignoree",
    ]);
    expect(resultat.lignes[0]?.paiementId).toBe(attendu.id);
    expect(resultat.totalCreditsCentimes).toBe(55000);
    expect(resultat.totalDebitsCentimes).toBe(-3250);
    expect(resultat.attendusCentimes).toBe(45000);
    expect(resultat.ecartBp).toBe(1818);
    expect(alerteEcart(resultat.ecartBp)).toBe(true);
    expect(resultat.paiementsNonRetrouves).toEqual([]);
  });

  it("ne rapproche pas au-delà de 3 jours et liste le paiement manquant", () => {
    const attendu = paiement({ datePaiement: "2026-10-01" });
    const resultat = rapprocher(
      [
        {
          dateOperation: "2026-10-10",
          libelle: "VIR TARDIF",
          montantCentimes: 45000,
          reference: null,
        },
      ],
      [attendu],
    );
    expect(resultat.lignes[0]?.statut).toBe("orpheline");
    expect(resultat.paiementsNonRetrouves).toHaveLength(1);
    expect(resultat.ecartBp).toBe(0);
  });

  it("ignore les paiements en espèces et ne consomme qu'une fois", () => {
    const especes = paiement({ mode: "especes" });
    const virement = paiement({ id: "p2", ref: "PAY-0002" });
    const resultat = rapprocher(
      [
        {
          dateOperation: "2026-10-15",
          libelle: "VIR 1",
          montantCentimes: 45000,
          reference: null,
        },
        {
          dateOperation: "2026-10-15",
          libelle: "VIR 2",
          montantCentimes: 45000,
          reference: null,
        },
      ],
      [especes, virement],
    );
    expect(resultat.lignes.map((ligne) => ligne.statut)).toEqual([
      "rapproche",
      "orpheline",
    ]);
    expect(resultat.paiementsNonRetrouves).toEqual([]);
    expect(resultat.attendusCentimes).toBe(45000);
  });

  it("détecte les orphelines de plus de 7 jours", () => {
    const resultat = rapprocher(
      [
        {
          dateOperation: "2026-10-01",
          libelle: "VIEUX VIREMENT",
          montantCentimes: 1000,
          reference: null,
        },
        {
          dateOperation: "2026-10-24",
          libelle: "RÉCENT",
          montantCentimes: 2000,
          reference: null,
        },
      ],
      [],
    );
    const anciennes = orphelinesAnciennes(
      resultat.lignes,
      new Date("2026-10-25T12:00:00Z"),
    );
    expect(anciennes).toHaveLength(1);
    expect(anciennes[0]?.libelle).toBe("VIEUX VIREMENT");
  });
});
