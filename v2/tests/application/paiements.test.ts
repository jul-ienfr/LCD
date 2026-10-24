import { describe, expect, it } from "vitest";
import { CreerFacture } from "@/application/use-cases/creer-facture";
import { EnregistrerPaiement } from "@/application/use-cases/enregistrer-paiement";
import { FactureRepositoryMemoire } from "../helpers/facture-repository-memoire";
import { PaiementRepositoryMemoire } from "../helpers/paiement-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";

async function contexte() {
  const factures = new FactureRepositoryMemoire();
  const facture = await new CreerFacture(factures).executer({
    tenantId,
    logementId,
    numero: "FAC-2026-0100",
    clientNom: "Client Paiement",
    dateEmission: "2026-11-20",
    tvaCentimes: 8_400,
    taxeSejourCentimes: 1_400,
    lignes: [
      {
        designation: "Séjour 7 nuits",
        quantite: 7,
        prixUnitaireCentimes: 12_000,
      },
    ],
  });
  await factures.changerStatut(tenantId, facture.id, "emise");
  const paiements = new PaiementRepositoryMemoire();
  return { factures, facture, paiements };
}

describe("EnregistrerPaiement", () => {
  it("encaisse un paiement partiel et laisse la facture émise", async () => {
    const { factures, facture, paiements } = await contexte();
    const resultat = await new EnregistrerPaiement(
      paiements,
      factures,
    ).executer({
      tenantId,
      factureId: facture.id,
      ref: "pay-00000001",
      montantCentimes: 20_000,
      mode: "virement",
      datePaiement: "2026-11-22",
      reference: "VIR-2026-11",
    });

    expect(resultat.cree).toBe(true);
    expect(resultat.facture.statut).toBe("emise");
    expect(resultat.resteCentimes).toBe(73_800);
  });

  it("passe la facture en payée quand le solde est réglé", async () => {
    const { factures, facture, paiements } = await contexte();
    const uc = new EnregistrerPaiement(paiements, factures);
    await uc.executer({
      tenantId,
      factureId: facture.id,
      ref: "pay-00000002",
      montantCentimes: 20_000,
      mode: "virement",
      datePaiement: "2026-11-22",
    });
    const resultat = await uc.executer({
      tenantId,
      factureId: facture.id,
      ref: "pay-00000003",
      montantCentimes: 73_800,
      mode: "cb",
      datePaiement: "2026-11-23",
    });

    expect(resultat.resteCentimes).toBe(0);
    expect(resultat.facture.statut).toBe("payee");
  });

  it("est idempotent sur la même référence", async () => {
    const { factures, facture, paiements } = await contexte();
    const uc = new EnregistrerPaiement(paiements, factures);
    const input = {
      tenantId,
      factureId: facture.id,
      ref: "pay-00000004",
      montantCentimes: 10_000,
      mode: "especes" as const,
      datePaiement: "2026-11-22",
    };
    const premier = await uc.executer(input);
    const second = await uc.executer(input);

    expect(premier.cree).toBe(true);
    expect(second.cree).toBe(false);
    expect(second.paiement.id).toBe(premier.paiement.id);
    expect(await paiements.listerParFacture(tenantId, facture.id)).toHaveLength(
      1,
    );
  });

  it("refuse un dépassement du reste à payer", async () => {
    const { factures, facture, paiements } = await contexte();
    await expect(
      new EnregistrerPaiement(paiements, factures).executer({
        tenantId,
        factureId: facture.id,
        ref: "pay-00000005",
        montantCentimes: 94_151,
        mode: "virement",
        datePaiement: "2026-11-22",
      }),
    ).rejects.toMatchObject({ code: "PAIEMENT_INVALIDE" });
  });

  it("refuse d'encaisser une facture en brouillon", async () => {
    const factures = new FactureRepositoryMemoire();
    const facture = await new CreerFacture(factures).executer({
      tenantId,
      logementId,
      numero: "FAC-2026-0101",
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
      new EnregistrerPaiement(
        new PaiementRepositoryMemoire(),
        factures,
      ).executer({
        tenantId,
        factureId: facture.id,
        ref: "pay-00000006",
        montantCentimes: 1_000,
        mode: "virement",
        datePaiement: "2026-11-22",
      }),
    ).rejects.toMatchObject({ code: "PAIEMENT_INVALIDE" });
  });
});
