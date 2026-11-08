import { describe, expect, it } from "vitest";
import { genererReleveProprietairePdf } from "@/infrastructure/adapters/pdf-releve-proprietaire";

describe("relevé propriétaire PDF", () => {
  it("produit un PDF avec les lignes et les totaux", async () => {
    const pdf = await genererReleveProprietairePdf({
      proprietaire: "Jeanne Dupont",
      moisLabel: "novembre 2026",
      lignes: [
        {
          logement: "Studio Centre",
          sejours: 3,
          caCentimes: 120_000,
          commissionCentimes: 24_000,
          chargesCentimes: 15_000,
          netCentimes: 81_000,
        },
        {
          logement: "Maison Jardin",
          sejours: 1,
          caCentimes: 40_000,
          commissionCentimes: 8_000,
          chargesCentimes: 15_000,
          netCentimes: 17_000,
        },
      ],
      totalCaCentimes: 160_000,
      totalCommissionCentimes: 32_000,
      totalChargesCentimes: 30_000,
      totalNetCentimes: 98_000,
    });

    expect(Buffer.from(pdf).subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.byteLength).toBeGreaterThan(1_000);
  });
});
