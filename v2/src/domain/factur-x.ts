// Génération Factur-X (profil EN 16931) au format XML CII.
// Ce fichier est volontairement pur : il ne dépend ni de Next ni de la base.
// Il prépare un XML structuré ; l'intégration PDF/A-3 et la signature restent
// à faire avec une plateforme de dématérialisation partenaire.

import type { Facture } from "./facture";

export interface FacturXOptions {
  vendeurNom: string;
  vendeurAdresse?: string | null;
  vendeurSiren?: string | null;
  tauxTvaBp: number;
  mentionsLegales?: string | null;
}

function echapperXml(valeur: string): string {
  return valeur
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function montant(centimes: number): string {
  return (centimes / 100).toFixed(2);
}

function taux(tauxTvaBp: number): string {
  return (tauxTvaBp / 100).toFixed(2);
}

/** Convertit AAAA-MM-JJ en AAAAAMMJJ (format 102 de la norme). */
function date102(dateIso: string): string {
  return dateIso.replaceAll("-", "");
}

function blocAdresse(adresse: string | null | undefined): string {
  if (!adresse?.trim()) return "";
  return `          <ram:PostalTradeAddress>
            <ram:LineOne>${echapperXml(adresse.trim())}</ram:LineOne>
            <ram:CountryID>FR</ram:CountryID>
          </ram:PostalTradeAddress>
`;
}

/**
 * Produit un XML CII « préparation Factur-X ». Les montants sont ceux de la
 * facture ; la taxe de séjour est portée en charge hors TVA.
 */
export function genererFacturXXml(
  facture: Facture,
  options: FacturXOptions,
): string {
  const lignes = facture.lignes
    .map(
      (ligne, index) => `      <ram:IncludedSupplyChainTradeLineItem>
        <ram:AssociatedDocumentLineDocument>
          <ram:LineID>${index + 1}</ram:LineID>
        </ram:AssociatedDocumentLineDocument>
        <ram:SpecifiedTradeProduct>
          <ram:Name>${echapperXml(ligne.designation)}</ram:Name>
        </ram:SpecifiedTradeProduct>
        <ram:SpecifiedLineTradeAgreement>
          <ram:NetPriceProductTradePrice>
            <ram:ChargeAmount>${montant(ligne.prixUnitaireCentimes)}</ram:ChargeAmount>
          </ram:NetPriceProductTradePrice>
        </ram:SpecifiedLineTradeAgreement>
        <ram:SpecifiedLineTradeDelivery>
          <ram:BilledQuantity unitCode="C62">${ligne.quantite}</ram:BilledQuantity>
        </ram:SpecifiedLineTradeDelivery>
        <ram:SpecifiedLineTradeSettlement>
          <ram:ApplicableTradeTax>
            <ram:TypeCode>VAT</ram:TypeCode>
            <ram:CategoryCode>S</ram:CategoryCode>
            <ram:RateApplicablePercent>${taux(options.tauxTvaBp)}</ram:RateApplicablePercent>
          </ram:ApplicableTradeTax>
          <ram:SpecifiedTradeSettlementLineMonetarySummation>
            <ram:LineTotalAmount>${montant(ligne.totalCentimes)}</ram:LineTotalAmount>
          </ram:SpecifiedTradeSettlementLineMonetarySummation>
        </ram:SpecifiedLineTradeSettlement>
      </ram:IncludedSupplyChainTradeLineItem>`,
    )
    .join("\n");

  const note = facture.notes?.trim()
    ? `    <ram:IncludedNote>
      <ram:Content>${echapperXml(facture.notes.trim())}</ram:Content>
    </ram:IncludedNote>
`
    : "";

  const mentions = options.mentionsLegales?.trim()
    ? `      <ram:IncludedNote>
        <ram:Content>${echapperXml(options.mentionsLegales.trim())}</ram:Content>
      </ram:IncludedNote>
`
    : "";

  const echeance = facture.echeance
    ? `      <ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${date102(facture.echeance)}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
`
    : "";

  const taxeSejour = facture.taxeSejourCentimes > 0
    ? `      <ram:SpecifiedTradeAllowanceCharge>
        <ram:ChargeIndicator>
          <udt:Indicator>true</udt:Indicator>
        </ram:ChargeIndicator>
        <ram:ActualAmount>${montant(facture.taxeSejourCentimes)}</ram:ActualAmount>
        <ram:Reason>Taxe de séjour</ram:Reason>
      </ram:SpecifiedTradeAllowanceCharge>
`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${echapperXml(facture.numero)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${date102(facture.dateEmission)}</udt:DateTimeString>
    </ram:IssueDateTime>
${note}${mentions}  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
${lignes}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${echapperXml(options.vendeurNom)}</ram:Name>
${options.vendeurSiren ? `        <ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${echapperXml(options.vendeurSiren)}</ram:ID></ram:SpecifiedLegalOrganization>\n` : ""}${blocAdresse(options.vendeurAdresse)}      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${echapperXml(facture.clientNom)}</ram:Name>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${montant(facture.tvaCentimes)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${montant(facture.montantHtCentimes)}</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>${taux(options.tauxTvaBp)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
${taxeSejour}${echeance}      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${montant(facture.montantHtCentimes)}</ram:LineTotalAmount>
        <ram:ChargeTotalAmount>${montant(facture.taxeSejourCentimes)}</ram:ChargeTotalAmount>
        <ram:TaxBasisTotalAmount>${montant(facture.montantHtCentimes)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${montant(facture.tvaCentimes)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${montant(facture.montantTtcCentimes)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${montant(facture.montantTtcCentimes)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
`;
}
