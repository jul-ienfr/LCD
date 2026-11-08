import { describe, expect, it } from "vitest";
import { ActiverFournisseur } from "@/application/use-cases/activer-fournisseur";
import { FournisseurRepositoryMemoire } from "../helpers/fournisseur-repository-memoire";

describe("ActiverFournisseur", () => {
  it("active un fournisseur du catalogue", async () => {
    const repo = new FournisseurRepositoryMemoire();
    await new ActiverFournisseur(repo).executer({
      code: "beds24",
      actif: true,
      acteur: "super@lcd.test",
    });
    expect(repo.activations.get("beds24")?.actif).toBe(true);
    expect(repo.activations.get("beds24")?.updatedBy).toBe("super@lcd.test");
  });

  it("refuse de désactiver un fournisseur encore affecté", async () => {
    const repo = new FournisseurRepositoryMemoire();
    repo.logements.push({
      tenantId: "tenant-1",
      tenantNom: "LCD",
      tenantSlug: "lcd",
      logementId: "logement-1",
      logementNom: "Villa",
      logementCode: "VIL",
      fournisseurCode: "beds24",
      externalPropertyId: "p-1",
      externalRoomTypeId: "r-1",
      externalRatePlanId: null,
      actif: true,
      derniereSync: null,
      dernierStatut: null,
      dernierMessage: null,
    });
    await expect(
      new ActiverFournisseur(repo).executer({
        code: "beds24",
        actif: false,
        acteur: "super@lcd.test",
      }),
    ).rejects.toMatchObject({ code: "FOURNISSEUR_INVALIDE" });
  });

  it("refuse un code inconnu", async () => {
    await expect(
      new ActiverFournisseur(new FournisseurRepositoryMemoire()).executer({
        code: "inconnu",
        actif: true,
        acteur: "super@lcd.test",
      }),
    ).rejects.toMatchObject({ code: "FOURNISSEUR_INVALIDE" });
  });
});
