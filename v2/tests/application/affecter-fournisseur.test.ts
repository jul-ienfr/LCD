import { describe, expect, it } from "vitest";
import { AffecterFournisseur } from "@/application/use-cases/affecter-fournisseur";
import { FournisseurRepositoryMemoire } from "../helpers/fournisseur-repository-memoire";

const base = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  logementId: "22222222-2222-4222-8222-222222222222",
};

describe("AffecterFournisseur", () => {
  it("affecte un fournisseur et ses identifiants externes", async () => {
    const repo = new FournisseurRepositoryMemoire();
    await repo.definirActivation("channex", true, "super@lcd.test");
    const affectation = await new AffecterFournisseur(repo).executer({
      ...base,
      fournisseurCode: "channex",
      externalPropertyId: "property-1",
      externalRoomTypeId: "room-1",
      externalRatePlanId: "rate-1",
    });
    expect(affectation.fournisseurCode).toBe("channex");
    expect(affectation.externalRoomTypeId).toBe("room-1");
    expect(affectation.externalRatePlanId).toBe("rate-1");
  });

  it("remplace le fournisseur d’un logement sans doublon", async () => {
    const repo = new FournisseurRepositoryMemoire();
    await repo.definirActivation("beds24", true, "super@lcd.test");
    await repo.definirActivation("smoobu", true, "super@lcd.test");
    const useCase = new AffecterFournisseur(repo);
    await useCase.executer({ ...base, fournisseurCode: "beds24" });
    await useCase.executer({ ...base, fournisseurCode: "smoobu" });
    expect(repo.affectations).toHaveLength(1);
    expect(repo.affectations[0]?.fournisseurCode).toBe("smoobu");
  });

  it("refuse un fournisseur non activé", async () => {
    await expect(
      new AffecterFournisseur(new FournisseurRepositoryMemoire()).executer({
        ...base,
        fournisseurCode: "beds24",
      }),
    ).rejects.toMatchObject({ code: "FOURNISSEUR_INVALIDE" });
  });

  it("refuse un code inconnu", async () => {
    await expect(
      new AffecterFournisseur(new FournisseurRepositoryMemoire()).executer({
        ...base,
        fournisseurCode: "inconnu",
      }),
    ).rejects.toMatchObject({ code: "FOURNISSEUR_INVALIDE" });
  });
});
