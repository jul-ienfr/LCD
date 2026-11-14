import { describe, expect, it } from "vitest";
import type { DemandeImportPrix, PricingPort } from "@/application/ports/pricing";
import { ErreurMetier } from "@/domain/erreurs";
import { creerPricingLocal } from "@/infrastructure/adapters/pricing-local";
import {
  creerPricingPriceLabs,
  versRecommandations,
} from "@/infrastructure/adapters/pricing-pricelabs";

const LOGEMENT = "22222222-2222-4222-8222-222222222222";

const DEMANDE: DemandeImportPrix = {
  logementId: LOGEMENT,
  debut: "2026-12-24",
  fin: "2026-12-26",
};

/** Toute implémentation du port deux respecter le même contrat. */
async function verifierContrat(port: PricingPort): Promise<void> {
  expect(typeof port.nom).toBe("string");
  expect(port.nom.length).toBeGreaterThan(0);
  expect(["partenaire", "local"]).toContain(port.source);
  expect(typeof port.estDisponible()).toBe("boolean");
  const resultat = await port.importer(DEMANDE);
  for (const ligne of resultat) {
    expect(ligne.jour).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isInteger(ligne.prixCentimes)).toBe(true);
    expect(ligne.prixCentimes).toBeGreaterThan(0);
    expect(ligne.confiance).toBeGreaterThanOrEqual(0);
    expect(ligne.confiance).toBeLessThanOrEqual(100);
    expect(Array.isArray(ligne.facteurs)).toBe(true);
  }
}

describe("contrat des adaptateurs pricing", () => {
  it("l'adaptateur local respecte le contrat et explique ses prix", async () => {
    const port = creerPricingLocal({
      lirePrixCatalogue: async () =>
        new Map([
          ["2026-12-24", 12_000],
          ["2026-12-25", 12_000],
        ]),
      tauxOccupation: async () => 0.85,
    });

    await verifierContrat(port);
    expect(port.estDisponible()).toBe(true);
    const lignes = await port.importer(DEMANDE);
    expect(lignes).toHaveLength(2);
    // Occupation forte (85 %) : stratégie « revenu », donc prix revus à la hausse.
    expect(lignes[0]!.prixCentimes).toBeGreaterThan(12_000);
    expect(lignes[0]!.facteurs.map((f) => f.code)).toContain("occupation");
  });

  it("l'adaptateur local ignore les jours sans prix catalogue", async () => {
    const port = creerPricingLocal({
      lirePrixCatalogue: async () => new Map([["2026-12-25", 9_000]]),
      tauxOccupation: async () => 0.4,
    });

    const lignes = await port.importer(DEMANDE);
    expect(lignes.map((ligne) => ligne.jour)).toEqual(["2026-12-25"]);
  });

  it("l'adaptateur PriceLabs reste indisponible sans clé partenaire", async () => {
    const port = creerPricingPriceLabs();
    expect(port.source).toBe("partenaire");
    expect(port.estDisponible()).toBe(false);
    if (port.estDisponible()) {
      await verifierContrat(port);
    } else {
      await expect(port.importer(DEMANDE)).rejects.toThrow(ErreurMetier);
    }
  });

  it("l'adaptateur PriceLabs mappe un payload réel et écarte le bruit", () => {
    const lignes = versRecommandations({
      listing_id: "42",
      prices: [
        { date: "2026-12-24", price: 150, occupancy: 0.7, demand_score: 0.8 },
        { date: "2026-12-25", price: 0 },
        { date: null, price: 200 },
        { date: "2026-12-26", user_price: 210, reason: "Fêtes", min_stay: 3 },
      ],
    });

    expect(lignes).toHaveLength(2);
    expect(lignes[0]).toEqual({
      jour: "2026-12-24",
      prixCentimes: 15_000,
      confiance: 80,
      facteurs: [
        { code: "occupation", libelle: "Occupation observée", impactPourcent: 70 },
      ],
    });
    expect(lignes[1]?.jour).toBe("2026-12-26");
    expect(lignes[1]?.prixCentimes).toBe(21_000);
    expect(lignes[1]?.confiance).toBe(60);
    expect(lignes[1]?.facteurs.map((facteur) => facteur.code)).toEqual([
      "duree-minimum",
      "motif-partenaire",
    ]);
  });

  it("l'adaptateur PriceLabs refuse l'import sans clé ni identifiant partenaire", async () => {
    const port = creerPricingPriceLabs();
    expect(port.estDisponible()).toBe(false);
    await expect(
      port.importer({ ...DEMANDE, referencePartenaire: "42" }),
    ).rejects.toThrow(/Clé PriceLabs absente/);
  });
});
