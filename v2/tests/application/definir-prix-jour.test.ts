import { describe, expect, it } from "vitest";
import { DefinirPrixJour } from "@/application/use-cases/definir-prix-jour";
import { TarifRepositoryMemoire } from "../helpers/tarif-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";

describe("DefinirPrixJour", () => {
  it("crée puis remplace le prix d'une date", async () => {
    const repo = new TarifRepositoryMemoire();
    const uc = new DefinirPrixJour(repo);

    const premier = await uc.executer({
      tenantId,
      logementId,
      date: "2026-11-15",
      prixCentimes: 15_000,
    });
    expect(premier.prixCentimes).toBe(15_000);

    const second = await uc.executer({
      tenantId,
      logementId,
      date: "2026-11-15",
      prixCentimes: 18_000,
    });
    expect(second.prixCentimes).toBe(18_000);
    expect(second.id).toBe(premier.id);
    expect(
      await repo.listerParMois(tenantId, logementId, "2026-11-01", "2026-11-30"),
    ).toHaveLength(1);
  });

  it("refuse un prix négatif ou non entier", async () => {
    const uc = new DefinirPrixJour(new TarifRepositoryMemoire());
    await expect(
      uc.executer({
        tenantId,
        logementId,
        date: "2026-11-15",
        prixCentimes: -1,
      }),
    ).rejects.toMatchObject({ code: "PRIX_INVALIDE" });
    await expect(
      uc.executer({
        tenantId,
        logementId,
        date: "2026-11-15",
        prixCentimes: 12.5,
      }),
    ).rejects.toMatchObject({ code: "PRIX_INVALIDE" });
  });

  it("refuse une date invalide", async () => {
    const uc = new DefinirPrixJour(new TarifRepositoryMemoire());
    await expect(
      uc.executer({
        tenantId,
        logementId,
        date: "2026-02-31",
        prixCentimes: 10_000,
      }),
    ).rejects.toMatchObject({ code: "PRIX_INVALIDE" });
  });
});
