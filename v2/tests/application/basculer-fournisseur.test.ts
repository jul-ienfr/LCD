import { beforeEach, describe, expect, it } from "vitest";
import { BasculerFournisseur } from "@/application/use-cases/basculer-fournisseur";
import { FournisseurRepositoryMemoire } from "../helpers/fournisseur-repository-memoire";

const TENANT = "11111111-1111-4111-8111-111111111111";
const LOGEMENT = "22222222-2222-4222-8222-222222222222";

describe("bascule d’affectation fournisseur", () => {
  let repo: FournisseurRepositoryMemoire;
  let basculer: BasculerFournisseur;

  beforeEach(async () => {
    repo = new FournisseurRepositoryMemoire();
    basculer = new BasculerFournisseur(repo);
    await repo.definirActivation("beds24", true, "test");
    await repo.affecter({
      tenantId: TENANT,
      logementId: LOGEMENT,
      fournisseurCode: "beds24",
      externalPropertyId: "prop-1",
      externalRoomTypeId: "room-1",
      externalRatePlanId: null,
    });
  });

  it("met l’affectation en pause sans supprimer le mapping", async () => {
    const resultat = await basculer.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      actif: false,
    });
    expect(resultat.actif).toBe(false);
    expect(resultat.externalPropertyId).toBe("prop-1");
    expect(repo.affectations).toHaveLength(1);
  });

  it("refuse la reprise si le fournisseur est désactivé", async () => {
    await basculer.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      actif: false,
    });
    await repo.definirActivation("beds24", false, "test");

    await expect(
      basculer.executer({
        tenantId: TENANT,
        logementId: LOGEMENT,
        actif: true,
      }),
    ).rejects.toMatchObject({ code: "FOURNISSEUR_INVALIDE" });
  });

  it("refuse un logement sans affectation", async () => {
    await expect(
      basculer.executer({
        tenantId: TENANT,
        logementId: "inconnu",
        actif: false,
      }),
    ).rejects.toMatchObject({ code: "FOURNISSEUR_INVALIDE" });
  });
});
