import { describe, expect, it } from "vitest";
import { CreerCanal } from "@/application/use-cases/creer-canal";
import { ModifierCanal } from "@/application/use-cases/modifier-canal";
import { CanalRepositoryMemoire } from "../helpers/canal-repository-memoire";

const base = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  logementId: "22222222-2222-4222-8222-222222222222",
};

describe("ModifierCanal", () => {
  it("modifie le nom, le buffer et la clé d’annonce", async () => {
    const repo = new CanalRepositoryMemoire();
    const canal = await new CreerCanal(repo).executer({
      ...base,
      code: "airbnb",
    });
    const modifie = await new ModifierCanal(repo).executer({
      tenantId: base.tenantId,
      canalId: canal.id,
      libelle: "Airbnb — Studio",
      externalListingId: "987",
      bufferJours: 2,
      actif: true,
      exportActif: false,
    });

    expect(modifie.libelle).toBe("Airbnb — Studio");
    expect(modifie.cle).toBe("airbnb:987");
    expect(modifie.bufferJours).toBe(2);
    expect(modifie.exportActif).toBe(false);
  });

  it("refuse un doublon d’identifiant d’annonce", async () => {
    const repo = new CanalRepositoryMemoire();
    const useCase = new CreerCanal(repo);
    await useCase.executer({
      ...base,
      code: "airbnb",
      externalListingId: "111",
    });
    const second = await useCase.executer({
      ...base,
      code: "airbnb",
      externalListingId: "222",
    });

    await expect(
      new ModifierCanal(repo).executer({
        tenantId: base.tenantId,
        canalId: second.id,
        libelle: second.libelle,
        externalListingId: "111",
      }),
    ).rejects.toMatchObject({ code: "CANAL_INVALIDE" });
  });

  it("refuse un canal inconnu", async () => {
    await expect(
      new ModifierCanal(new CanalRepositoryMemoire()).executer({
        tenantId: base.tenantId,
        canalId: "00000000-0000-4000-8000-000000000000",
        libelle: "Canal",
      }),
    ).rejects.toMatchObject({ code: "CANAL_INVALIDE" });
  });
});
