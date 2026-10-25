import { describe, expect, it } from "vitest";
import { genererFacturXXml } from "@/domain/factur-x";
import type { Facture } from "@/domain/facture";

const facture: Facture = {
  id: "facture-1",
  tenantId: "tenant-1",
  logementId: "logement-1",
  reservationId: "reservation-1",
  numero: "FAC-2026-0001",
  clientNom: "Dupont & Fils",
  clientEmail: "client@example.com",
  dateEmission: "2026-11-20",
  echeance: "2026-12-20",
  montantHtCentimes: 84_000,
  tvaCentimes: 8_400,
  taxeSejourCentimes: 1_400,
  montantTtcCentimes: 93_800,
  statut: "emise",
  notes: "Séjour <test>",
  lignes: [
    {
      id: "ligne-1",
      designation: "Séjour 7 nuits",
      quantite: 7,
      prixUnitaireCentimes: 12_000,
      totalCentimes: 84_000,
    },
  ],
  createdAt: new Date("2026-11-20T10:00:00Z"),
  updatedAt: new Date("2026-11-20T10:00:00Z"),
};

describe("Factur-X", () => {
  it("génère un XML CII avec les totaux et la TVA", () => {
    const xml = genererFacturXXml(facture, {
      vendeurNom: "LCD Parc",
      vendeurAdresse: "12 rue des Lilas, 75011 Paris",
      vendeurSiren: "123456789",
      tauxTvaBp: 1_000,
      mentionsLegales: "TVA non applicable, art. 293 B du CGI",
    });

    expect(xml).toContain("<rsm:CrossIndustryInvoice");
    expect(xml).toContain("<ram:ID>FAC-2026-0001</ram:ID>");
    expect(xml).toContain(
      '<udt:DateTimeString format="102">20261120</udt:DateTimeString>',
    );
    expect(xml).toContain(
      '<udt:DateTimeString format="102">20261220</udt:DateTimeString>',
    );
    expect(xml).toContain("<ram:LineTotalAmount>840.00</ram:LineTotalAmount>");
    expect(xml).toContain(
      '<ram:TaxTotalAmount currencyID="EUR">84.00</ram:TaxTotalAmount>',
    );
    expect(xml).toContain("<ram:GrandTotalAmount>938.00</ram:GrandTotalAmount>");
    expect(xml).toContain("<ram:Reason>Taxe de séjour</ram:Reason>");
    expect(xml).toContain("<ram:RateApplicablePercent>10.00</ram:RateApplicablePercent>");
    expect(xml).toContain(
      '<ram:ID schemeID="0002">123456789</ram:ID>',
    );
  });

  it("échappe les caractères XML et reprend les notes", () => {
    const xml = genererFacturXXml(facture, {
      vendeurNom: "LCD & Co",
      tauxTvaBp: 1_000,
    });

    expect(xml).toContain("Dupont &amp; Fils");
    expect(xml).toContain("Séjour &lt;test&gt;");
    expect(xml).toContain("LCD &amp; Co");
  });
});
