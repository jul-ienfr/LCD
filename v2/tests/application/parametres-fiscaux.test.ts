import { describe, expect, it } from "vitest";
import {
  EnregistrerParametresFiscaux,
  ObtenirParametresFiscaux,
} from "@/application/use-cases/parametres-fiscaux";
import { ParametresFiscauxRepositoryMemoire } from "../helpers/parametres-fiscaux-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";

describe("paramètres fiscaux", () => {
  it("retourne les valeurs par défaut quand rien n'est enregistré", async () => {
    const parametres = await new ObtenirParametresFiscaux(
      new ParametresFiscauxRepositoryMemoire(),
    ).executer(tenantId);

    expect(parametres.tenantId).toBe(tenantId);
    expect(parametres.tauxTvaBp).toBe(1_000);
    expect(parametres.prefixeFacture).toBe("FAC");
  });

  it("enregistre et relit les paramètres", async () => {
    const repo = new ParametresFiscauxRepositoryMemoire();
    const enregistrer = new EnregistrerParametresFiscaux(repo);
    const obtenir = new ObtenirParametresFiscaux(repo);

    await enregistrer.executer({
      tenantId,
      tauxTvaBp: 550,
      taxeSejourNuitPersonneCentimes: 150,
      taxeSejourPlafondCentimes: 420,
      prefixeFacture: " sej ",
      mentionsLegales: "  Mentions  ",
    });

    const parametres = await obtenir.executer(tenantId);
    expect(parametres.tauxTvaBp).toBe(550);
    expect(parametres.taxeSejourNuitPersonneCentimes).toBe(150);
    expect(parametres.taxeSejourPlafondCentimes).toBe(420);
    expect(parametres.prefixeFacture).toBe("SEJ");
    expect(parametres.mentionsLegales).toBe("Mentions");
  });

  it("refuse un taux de TVA invalide", async () => {
    await expect(
      new EnregistrerParametresFiscaux(
        new ParametresFiscauxRepositoryMemoire(),
      ).executer({
        tenantId,
        tauxTvaBp: 20_000,
        taxeSejourNuitPersonneCentimes: 0,
        taxeSejourPlafondCentimes: null,
        prefixeFacture: "FAC",
      }),
    ).rejects.toMatchObject({ code: "FISCALITE_INVALIDE" });
  });

  it("refuse un préfixe invalide", async () => {
    await expect(
      new EnregistrerParametresFiscaux(
        new ParametresFiscauxRepositoryMemoire(),
      ).executer({
        tenantId,
        tauxTvaBp: 1_000,
        taxeSejourNuitPersonneCentimes: 0,
        taxeSejourPlafondCentimes: null,
        prefixeFacture: "FAC-26",
      }),
    ).rejects.toMatchObject({ code: "FISCALITE_INVALIDE" });
  });
});
