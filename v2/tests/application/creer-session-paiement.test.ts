import { describe, expect, it } from "vitest";
import { CreerFacture } from "@/application/use-cases/creer-facture";
import { CreerSessionPaiement } from "@/application/use-cases/creer-session-paiement";
import { FactureRepositoryMemoire } from "../helpers/facture-repository-memoire";
import { PaiementPortMemoire } from "../helpers/paiement-port-memoire";
import { PaiementRepositoryMemoire } from "../helpers/paiement-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";

async function contexte() {
  const factures = new FactureRepositoryMemoire();
  const facture = await new CreerFacture(factures).executer({
    tenantId,
    logementId,
    numero: "FAC-2026-0300",
    clientNom: "Client Stripe",
    clientEmail: "client@example.com",
    dateEmission: "2026-11-20",
    tvaCentimes: 3_600,
    taxeSejourCentimes: 900,
    lignes: [
      {
        designation: "Séjour 3 nuits",
        quantite: 3,
        prixUnitaireCentimes: 12_000,
      },
    ],
  });
  await factures.changerStatut(tenantId, facture.id, "emise");
  const paiements = new PaiementRepositoryMemoire();
  const port = new PaiementPortMemoire();
  return { factures, facture, paiements, port };
}

const urls = {
  successUrl: "https://lcd.test/facture/token?paiement=ok",
  cancelUrl: "https://lcd.test/facture/token?paiement=annule",
};

describe("CreerSessionPaiement", () => {
  it("crée une session Stripe pour le reste à payer", async () => {
    const { factures, facture, paiements, port } = await contexte();
    const resultat = await new CreerSessionPaiement(
      factures,
      paiements,
      port,
    ).executer({
      tenantId,
      factureId: facture.id,
      ...urls,
    });

    expect(resultat.montantCentimes).toBe(40_500);
    expect(resultat.session.url).toContain("checkout.stripe.test");
    expect(port.intentions[0]?.metadata).toMatchObject({
      tenant_id: tenantId,
      facture_id: facture.id,
    });
    expect(port.intentions[0]?.emailClient).toBe("client@example.com");
  });

  it("accepte un paiement partiel", async () => {
    const { factures, facture, paiements, port } = await contexte();
    const resultat = await new CreerSessionPaiement(
      factures,
      paiements,
      port,
    ).executer({
      tenantId,
      factureId: facture.id,
      montantCentimes: 10_000,
      ...urls,
    });

    expect(resultat.montantCentimes).toBe(10_000);
  });

  it("refuse un montant supérieur au reste", async () => {
    const { factures, facture, paiements, port } = await contexte();
    await expect(
      new CreerSessionPaiement(factures, paiements, port).executer({
        tenantId,
        factureId: facture.id,
        montantCentimes: 40_501,
        ...urls,
      }),
    ).rejects.toMatchObject({ code: "PAIEMENT_INVALIDE" });
  });

  it("refuse une facture en brouillon", async () => {
    const { factures, paiements, port } = await contexte();
    const brouillon = await new CreerFacture(factures).executer({
      tenantId,
      logementId,
      numero: "FAC-2026-0301",
      clientNom: "Client Brouillon",
      dateEmission: "2026-11-20",
      tvaCentimes: 0,
      taxeSejourCentimes: 0,
      lignes: [
        {
          designation: "Séjour",
          quantite: 1,
          prixUnitaireCentimes: 10_000,
        },
      ],
    });

    await expect(
      new CreerSessionPaiement(factures, paiements, port).executer({
        tenantId,
        factureId: brouillon.id,
        ...urls,
      }),
    ).rejects.toMatchObject({ code: "PAIEMENT_INVALIDE" });
  });
});
