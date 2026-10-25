import { describe, expect, it } from "vitest";
import { CreerFacture } from "@/application/use-cases/creer-facture";
import { TraiterPaiementStripe } from "@/application/use-cases/traiter-paiement-stripe";
import type { EvenementPaiement } from "@/application/ports/paiement";
import { FactureRepositoryMemoire } from "../helpers/facture-repository-memoire";
import { PaiementRepositoryMemoire } from "../helpers/paiement-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";

async function contexte() {
  const factures = new FactureRepositoryMemoire();
  const facture = await new CreerFacture(factures).executer({
    tenantId,
    logementId,
    numero: "FAC-2026-0400",
    clientNom: "Client Webhook",
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
  return { factures, facture, paiements };
}

function evenement(factureId: string): EvenementPaiement {
  return {
    type: "paiement_reussi",
    sessionId: "cs_test_a1b2c3d4e5",
    montantCentimes: 40_500,
    devise: "EUR",
    reference: "FAC-2026-0400",
    metadata: { tenant_id: tenantId, facture_id: factureId },
  };
}

describe("TraiterPaiementStripe", () => {
  it("enregistre le paiement et solde la facture", async () => {
    const { factures, facture, paiements } = await contexte();
    const resultat = await new TraiterPaiementStripe(
      paiements,
      factures,
    ).executer(evenement(facture.id));

    expect(resultat.ignore).toBe(false);
    if (resultat.ignore) return;
    expect(resultat.paiement.mode).toBe("cb");
    expect(resultat.facture.statut).toBe("payee");
    expect(resultat.resteCentimes).toBe(0);
  });

  it("est idempotent sur le même événement", async () => {
    const { factures, facture, paiements } = await contexte();
    const uc = new TraiterPaiementStripe(paiements, factures);
    await uc.executer(evenement(facture.id));
    const second = await uc.executer(evenement(facture.id));

    expect(second.ignore).toBe(false);
    if (second.ignore) return;
    expect(second.cree).toBe(false);
    expect(await paiements.listerParFacture(tenantId, facture.id)).toHaveLength(
      1,
    );
  });

  it("ignore les autres types d'événements", async () => {
    const { factures, facture, paiements } = await contexte();
    const resultat = await new TraiterPaiementStripe(
      paiements,
      factures,
    ).executer({ ...evenement(facture.id), type: "autre" });

    expect(resultat.ignore).toBe(true);
  });

  it("refuse un événement sans métadonnées", async () => {
    const { factures, facture, paiements } = await contexte();
    await expect(
      new TraiterPaiementStripe(paiements, factures).executer({
        ...evenement(facture.id),
        metadata: {},
      }),
    ).rejects.toMatchObject({ code: "PAIEMENT_INVALIDE" });
  });
});
