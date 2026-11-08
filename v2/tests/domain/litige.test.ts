import { describe, expect, it } from "vitest";
import { composerDossierLitige } from "@/domain/litige";

const base = {
  facture: {
    numero: "FAC-2026-0007",
    dateEmission: "2026-10-12",
    montantTtcCentimes: 48_000,
    statut: "payee",
  },
  clientNom: "Élise Dupont",
  sejour: {
    ref: "RES-2026-0042",
    debut: "2026-10-05",
    fin: "2026-10-12",
    logement: "Appartement Marais",
  },
  paiements: [
    {
      date: "2026-10-12",
      mode: "Carte bancaire",
      montantCentimes: 48_000,
      reference: "PAY-2026-0042",
    },
  ],
  motif: "Le client conteste la taxe de séjour.",
  montantContesteCentimes: 4_800,
  dateLitige: "2026-11-01",
  editeur: "LCD Parc",
};

describe("dossier de litige", () => {
  it("reprend facture, séjour, paiements et motif", () => {
    const dossier = composerDossierLitige(base);
    expect(dossier.reference).toBe("FAC-2026-0007-LITIGE");
    expect(dossier.texte).toContain("FAC-2026-0007");
    expect(dossier.texte).toContain("RES-2026-0042");
    expect(dossier.texte).toContain("Élise Dupont");
    expect(dossier.texte).toContain("48,00 €");
    expect(dossier.texte).toContain("PAY-2026-0042");
    expect(dossier.texte).toContain("Le client conteste la taxe de séjour.");
  });

  it("plafonne le montant contesté aux paiements réellement encaissés", () => {
    const dossier = composerDossierLitige({
      ...base,
      montantContesteCentimes: 99_000,
    });
    expect(dossier.montantContesteCentimes).toBe(48_000);
    expect(dossier.texte).toContain("Montant : 480,00 €");
  });

  it("accepte une facture sans séjour ni paiement", () => {
    const dossier = composerDossierLitige({
      ...base,
      sejour: null,
      paiements: [],
      montantContesteCentimes: 1_000,
    });
    expect(dossier.montantContesteCentimes).toBe(0);
    expect(dossier.texte).toContain("Aucun séjour rattaché");
    expect(dossier.texte).toContain("Aucun paiement enregistré");
  });
});
