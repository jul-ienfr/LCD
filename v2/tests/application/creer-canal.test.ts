import { describe, expect, it } from "vitest";
import { CreerCanal } from "@/application/use-cases/creer-canal";
import { CanalRepositoryMemoire } from "../helpers/canal-repository-memoire";

const base = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  logementId: "22222222-2222-4222-8222-222222222222",
};

describe("CreerCanal", () => {
  it("crée un canal avec le nom du catalogue et un flux iCal", async () => {
    const repo = new CanalRepositoryMemoire();
    const canal = await new CreerCanal(repo).executer({
      ...base,
      code: "airbnb",
      url: "webcal://example.com/calendar.ics",
      bufferJours: 1,
    });

    expect(canal.libelle).toBe("Airbnb");
    expect(canal.cle).toBe("airbnb:principal");
    expect(canal.bufferJours).toBe(1);
    expect(canal.exportActif).toBe(true);
    expect(repo.fluxCrees).toEqual([
      {
        canalId: canal.id,
        flux: { url: "https://example.com/calendar.ics", intervalleMinutes: 5 },
      },
    ]);
  });

  it("crée un canal d’export sans flux import", async () => {
    const repo = new CanalRepositoryMemoire();
    const canal = await new CreerCanal(repo).executer({
      ...base,
      code: "generique",
      libelle: "Portail local",
    });

    expect(canal.libelle).toBe("Portail local");
    expect(repo.fluxCrees).toHaveLength(0);
  });

  it("refuse un code inconnu", async () => {
    await expect(
      new CreerCanal(new CanalRepositoryMemoire()).executer({
        ...base,
        code: "inconnu",
      }),
    ).rejects.toMatchObject({ code: "CANAL_INVALIDE" });
  });

  it("refuse une URL non HTTPS publique", async () => {
    await expect(
      new CreerCanal(new CanalRepositoryMemoire()).executer({
        ...base,
        code: "airbnb",
        url: "http://localhost:3000/calendar.ics",
      }),
    ).rejects.toMatchObject({ code: "CANAL_INVALIDE" });
  });

  it("refuse un buffer hors bornes", async () => {
    await expect(
      new CreerCanal(new CanalRepositoryMemoire()).executer({
        ...base,
        code: "airbnb",
        bufferJours: 8,
      }),
    ).rejects.toMatchObject({ code: "CANAL_INVALIDE" });
  });

  it("refuse un doublon de canal", async () => {
    const repo = new CanalRepositoryMemoire();
    const useCase = new CreerCanal(repo);
    await useCase.executer({ ...base, code: "airbnb" });
    await expect(
      useCase.executer({ ...base, code: "airbnb" }),
    ).rejects.toMatchObject({ code: "CANAL_INVALIDE" });
  });

  it("distingue deux annonces de la même plateforme", async () => {
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
    expect(second.cle).toBe("airbnb:222");
  });
});
