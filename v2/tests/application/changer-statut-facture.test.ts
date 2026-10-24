import { describe, expect, it } from "vitest";
import { ChangerStatutFacture } from "@/application/use-cases/changer-statut-facture";
import { CreerFacture } from "@/application/use-cases/creer-facture";
import { FactureRepositoryMemoire } from "../helpers/facture-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";

async function factureBrouillon() {
  const repo = new FactureRepositoryMemoire();
  const facture = await new CreerFacture(repo).executer({
    tenantId,
    logementId,
    numero: `FAC-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
    clientNom: "Client Statut",
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
  return { repo, facture };
}

describe("ChangerStatutFacture", () => {
  it("suit brouillon → émise → payée", async () => {
    const { repo, facture } = await factureBrouillon();
    const uc = new ChangerStatutFacture(repo);

    const emise = await uc.executer({
      tenantId,
      factureId: facture.id,
      statut: "emise",
    });
    expect(emise.statut).toBe("emise");

    const payee = await uc.executer({
      tenantId,
      factureId: facture.id,
      statut: "payee",
    });
    expect(payee.statut).toBe("payee");
  });

  it("refuse payée → annulée", async () => {
    const { repo, facture } = await factureBrouillon();
    const uc = new ChangerStatutFacture(repo);
    await uc.executer({ tenantId, factureId: facture.id, statut: "emise" });
    await uc.executer({ tenantId, factureId: facture.id, statut: "payee" });

    await expect(
      uc.executer({ tenantId, factureId: facture.id, statut: "annulee" }),
    ).rejects.toMatchObject({ code: "FACTURE_INVALIDE" });
  });
});
