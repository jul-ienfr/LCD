import { describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import type { Facture } from "@/domain/facture";
import { genererPdfFacture } from "@/infrastructure/adapters/pdf-facture";

const facture: Facture = {
  id: "facture-pdf",
  tenantId: "tenant-1",
  logementId: "logement-1",
  reservationId: null,
  numero: "FAC-2026-0500",
  clientNom: "Élise Dupont",
  clientEmail: "elise@example.com",
  dateEmission: "2026-11-20",
  echeance: "2026-12-20",
  montantHtCentimes: 36_000,
  tvaCentimes: 3_600,
  taxeSejourCentimes: 900,
  montantTtcCentimes: 40_500,
  statut: "emise",
  notes: null,
  lignes: [
    {
      id: "ligne-1",
      designation: "Séjour 3 nuits — appartement",
      quantite: 3,
      prixUnitaireCentimes: 12_000,
      totalCentimes: 36_000,
    },
  ],
  createdAt: new Date("2026-11-20T10:00:00Z"),
  updatedAt: new Date("2026-11-20T10:00:00Z"),
};

describe("PDF facture", () => {
  it("génère un PDF avec le XML Factur-X incorporé", async () => {
    const attache = vi.spyOn(PDFDocument.prototype, "attach");
    const pdf = await genererPdfFacture(facture, {
      vendeurNom: "LCD Parc",
      vendeurAdresse: "12 rue des Lilas, 75011 Paris",
      logementNom: "Appartement Marais",
      xmlFacturX: "<rsm:CrossIndustryInvoice>test</rsm:CrossIndustryInvoice>",
      montantPayeCentimes: 20_000,
      resteCentimes: 20_500,
      mentionsLegales: "TVA acquittée sur les encaissements.",
    });

    expect(Buffer.from(pdf).subarray(0, 4).toString()).toBe("%PDF");
    const document = await PDFDocument.load(pdf);
    expect(document.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(document.getTitle()).toContain("FAC-2026-0500");
    expect(attache).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      "factur-x.xml",
      expect.any(Object),
    );
    attache.mockRestore();
  });

  it("supporte plusieurs lignes", async () => {
    const pdf = await genererPdfFacture(
      {
        ...facture,
        lignes: Array.from({ length: 30 }, (_, index) => ({
          id: `ligne-${index}`,
          designation: `Prestation ${index + 1}`,
          quantite: 1,
          prixUnitaireCentimes: 1_000,
          totalCentimes: 1_000,
        })),
        montantHtCentimes: 30_000,
        montantTtcCentimes: 34_500,
        tvaCentimes: 3_000,
        taxeSejourCentimes: 1_500,
      },
      {
        vendeurNom: "LCD Parc",
        xmlFacturX: "<xml/>",
      },
    );
    const document = await PDFDocument.load(pdf);
    expect(document.getPageCount()).toBeGreaterThan(1);
  });
});
