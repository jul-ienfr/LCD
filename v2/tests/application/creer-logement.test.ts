import { describe, expect, it } from "vitest";
import { CreerLogement } from "@/application/use-cases/creer-logement";
import { LogementRepositoryMemoire } from "../helpers/logement-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";

describe("CreerLogement", () => {
  it("crée un logement valide et normalise le code", async () => {
    const repo = new LogementRepositoryMemoire();
    const useCase = new CreerLogement(repo);

    const logement = await useCase.executer({
      tenantId,
      code: "LOG-1",
      nom: "Santa Severa",
      adresse: "Saint-Laurent-du-Var",
    });

    expect(logement.code).toBe("log-1");
    expect(logement.nom).toBe("Santa Severa");
    expect(await repo.listerParTenant(tenantId)).toHaveLength(1);
  });

  it("refuse un code invalide", async () => {
    const useCase = new CreerLogement(new LogementRepositoryMemoire());

    await expect(
      useCase.executer({ tenantId, code: "Log 1 !", nom: "Test" }),
    ).rejects.toMatchObject({ code: "CODE_INVALIDE" });
  });

  it("refuse un doublon pour le même tenant", async () => {
    const repo = new LogementRepositoryMemoire();
    const useCase = new CreerLogement(repo);

    await useCase.executer({ tenantId, code: "log-1", nom: "Premier" });
    await expect(
      useCase.executer({ tenantId, code: "LOG-1", nom: "Deuxième" }),
    ).rejects.toMatchObject({ code: "LOGEMENT_DEJA_EXISTANT" });
  });

  it("autorise le même code pour deux tenants différents", async () => {
    const repo = new LogementRepositoryMemoire();
    const useCase = new CreerLogement(repo);

    await useCase.executer({ tenantId, code: "log-1", nom: "Tenant A" });
    await useCase.executer({
      tenantId: "22222222-2222-4222-8222-222222222222",
      code: "log-1",
      nom: "Tenant B",
    });

    expect(await repo.listerParTenant(tenantId)).toHaveLength(1);
  });
});
