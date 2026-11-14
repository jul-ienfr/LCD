import { describe, expect, it } from "vitest";
import {
  COLONNES_EXPORT_COMPTABLE,
  COMPTE_BANQUE,
  COMPTE_CAISSE,
  COMPTE_CLIENTS,
  COMPTE_TAXE_SEJOUR,
  COMPTE_TVA_COLLECTEE,
  COMPTE_VENTES,
  DEVISE_EXPORT,
  VERSION_EXPORT_COMPTABLE,
  compteTresorerie,
  construireJournalComptable,
  versCellulesLigne,
  versLigneJournalPaiement,
  versLignesJournalFacture,
} from "@/domain/export-comptable";
import type { Facture } from "@/domain/facture";

function facture(overrides: Partial<Facture> = {}): Facture {
  return {
    id: "fact-1",
    tenantId: "tenant-1",
    logementId: "log-1",
    reservationId: null,
    numero: "FAC-2026-0001",
    clientNom: "Jean Dupont",
    clientEmail: "jean@example.com",
    dateEmission: "2026-03-15",
    echeance: null,
    montantHtCentimes: 100_000,
    tvaCentimes: 10_000,
    taxeSejourCentimes: 2_000,
    montantTtcCentimes: 112_000,
    statut: "emise",
    notes: null,
    lignes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("export-comptable — schéma stable (T512)", () => {
  it("expose une version entière positive", () => {
    expect(Number.isInteger(VERSION_EXPORT_COMPTABLE)).toBe(true);
    expect(VERSION_EXPORT_COMPTABLE).toBeGreaterThan(0);
  });

  it("fige la liste et l'ordre des colonnes", () => {
    expect([...COLONNES_EXPORT_COMPTABLE]).toEqual([
      "version",
      "journal",
      "date",
      "piece",
      "compte",
      "libelle",
      "debit_centimes",
      "credit_centimes",
      "devise",
    ]);
  });

  it("une ligne produit exactement une cellule par colonne", () => {
    const [ligne] = versLignesJournalFacture(facture());
    const cellules = versCellulesLigne(ligne!);
    expect(cellules).toHaveLength(COLONNES_EXPORT_COMPTABLE.length);
    expect(cellules[0]).toBe(VERSION_EXPORT_COMPTABLE);
    expect(cellules[cellules.length - 1]).toBe(DEVISE_EXPORT);
  });
});

describe("compteTresorerie (T512)", () => {
  it("les espèces vont en caisse, les autres modes en banque", () => {
    expect(compteTresorerie("especes")).toBe(COMPTE_CAISSE);
    expect(compteTresorerie("cb")).toBe(COMPTE_BANQUE);
    expect(compteTresorerie("virement")).toBe(COMPTE_BANQUE);
    expect(compteTresorerie("cheque")).toBe(COMPTE_BANQUE);
    expect(compteTresorerie("autre")).toBe(COMPTE_BANQUE);
  });
});

describe("versLignesJournalFacture (T512)", () => {
  it("produit une écriture équilibrée (débit TTC = crédits HT+TVA+taxe)", () => {
    const lignes = versLignesJournalFacture(facture());
    const debit = lignes.reduce((s, l) => s + l.debitCentimes, 0);
    const credit = lignes.reduce((s, l) => s + l.creditCentimes, 0);
    expect(debit).toBe(credit);
    expect(debit).toBe(112_000);
  });

  it("débite les clients et crédite ventes, TVA et taxe de séjour", () => {
    const lignes = versLignesJournalFacture(facture());
    const parCompte = new Map(lignes.map((l) => [l.compte, l]));
    expect(parCompte.get(COMPTE_CLIENTS)?.debitCentimes).toBe(112_000);
    expect(parCompte.get(COMPTE_VENTES)?.creditCentimes).toBe(100_000);
    expect(parCompte.get(COMPTE_TVA_COLLECTEE)?.creditCentimes).toBe(10_000);
    expect(parCompte.get(COMPTE_TAXE_SEJOUR)?.creditCentimes).toBe(2_000);
  });

  it("omets les lignes de TVA ou taxe nulles", () => {
    const lignes = versLignesJournalFacture(
      facture({ tvaCentimes: 0, taxeSejourCentimes: 0, montantTtcCentimes: 100_000 }),
    );
    const comptes = lignes.map((l) => l.compte);
    expect(comptes).not.toContain(COMPTE_TVA_COLLECTEE);
    expect(comptes).not.toContain(COMPTE_TAXE_SEJOUR);
    expect(comptes).toContain(COMPTE_VENTES);
  });

  it("une facture annulée ne produit aucune ligne", () => {
    expect(versLignesJournalFacture(facture({ statut: "annulee" }))).toEqual([]);
  });

  it("une facture brouillon ne produit aucune ligne", () => {
    expect(versLignesJournalFacture(facture({ statut: "brouillon" }))).toEqual([]);
  });
});

describe("versLigneJournalPaiement (T512)", () => {
  it("débite la trésorerie et crédite les clients", () => {
    const lignes = versLigneJournalPaiement({
      ref: "pay-1",
      datePaiement: "2026-03-20",
      montantCentimes: 50_000,
      mode: "cb",
    });
    expect(lignes).toHaveLength(2);
    const debit = lignes.find((l) => l.debitCentimes > 0);
    const credit = lignes.find((l) => l.creditCentimes > 0);
    expect(debit?.compte).toBe(COMPTE_BANQUE);
    expect(credit?.compte).toBe(COMPTE_CLIENTS);
    expect(debit?.debitCentimes).toBe(credit?.creditCentimes);
  });

  it("ignore un paiement de montant nul ou négatif", () => {
    expect(
      versLigneJournalPaiement({
        ref: "pay-0",
        datePaiement: "2026-03-20",
        montantCentimes: 0,
        mode: "cb",
      }),
    ).toEqual([]);
  });
});

describe("construireJournalComptable (T512)", () => {
  it("combine ventes et trésorerie, triées par date puis pièce puis compte", () => {
    const journal = construireJournalComptable({
      factures: [
        facture({ numero: "FAC-B", dateEmission: "2026-03-20" }),
        facture({ numero: "FAC-A", dateEmission: "2026-03-10" }),
      ],
      paiements: [
        {
          ref: "pay-1",
          datePaiement: "2026-03-01",
          montantCentimes: 5_000,
          mode: "especes",
        },
      ],
    });
    const dates = journal.map((l) => l.date);
    expect(dates).toEqual([...dates].sort());
    // La pièce la plus ancienne est le paiement du 01/03. À date et pièce
    // égales, le tri par compte place les clients (411000) avant la caisse.
    expect(journal[0]?.date).toBe("2026-03-01");
    expect(journal[0]?.piece).toBe("pay-1");
    expect(journal[0]?.compte).toBe(COMPTE_CLIENTS);
    const caisse = journal.find((ligne) => ligne.compte === COMPTE_CAISSE);
    expect(caisse?.debitCentimes).toBe(5_000);
  });

  it("retourne un tableau vide sans facture ni paiement", () => {
    expect(construireJournalComptable({ factures: [], paiements: [] })).toEqual([]);
  });

  it("chaque pièce est équilibrée (total débits = total crédits)", () => {
    const journal = construireJournalComptable({
      factures: [facture()],
      paiements: [
        {
          ref: "pay-1",
          datePaiement: "2026-03-20",
          montantCentimes: 112_000,
          mode: "virement",
        },
      ],
    });
    const debit = journal.reduce((s, l) => s + l.debitCentimes, 0);
    const credit = journal.reduce((s, l) => s + l.creditCentimes, 0);
    expect(debit).toBe(credit);
  });
});
