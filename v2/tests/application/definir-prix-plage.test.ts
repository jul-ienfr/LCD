import { beforeEach, describe, expect, it } from "vitest";
import { DefinirPrixPlage } from "@/application/use-cases/definir-prix-plage";
import { TarifRepositoryMemoire } from "../helpers/tarif-repository-memoire";

describe("DefinirPrixPlage", () => {
  let tarifs: TarifRepositoryMemoire;
  let casUsage: DefinirPrixPlage;

  beforeEach(() => {
    tarifs = new TarifRepositoryMemoire();
    casUsage = new DefinirPrixPlage(tarifs);
  });

  it("applique le prix à chaque date de la plage", async () => {
    const resultat = await casUsage.executer({
      tenantId: "t1",
      logementId: "l1",
      dateDebut: "2027-01-01",
      dateFin: "2027-01-03",
      prixCentimes: 15000,
    });
    expect(resultat.dates).toEqual([
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
    ]);
    expect(resultat.tarifs).toHaveLength(3);
    expect(
      await tarifs.listerParMois("t1", "l1", "2027-01-01", "2027-01-31"),
    ).toHaveLength(3);
  });

  it("filtre par jours de semaine et isole le plan", async () => {
    const resultat = await casUsage.executer({
      tenantId: "t1",
      logementId: "l1",
      planTarifaireId: "plan-1",
      dateDebut: "2027-01-01",
      dateFin: "2027-01-03",
      joursSemaine: [6, 7],
      prixCentimes: 12000,
    });
    expect(resultat.dates).toEqual(["2027-01-02", "2027-01-03"]);
    expect(
      await tarifs.listerParMois("t1", "l1", "2027-01-01", "2027-01-31"),
    ).toHaveLength(0);
    expect(
      await tarifs.listerParMois(
        "t1",
        "l1",
        "2027-01-01",
        "2027-01-31",
        "plan-1",
      ),
    ).toHaveLength(2);
  });

  it("refuse une plage invalide ou sans date", async () => {
    await expect(
      casUsage.executer({
        tenantId: "t1",
        logementId: "l1",
        dateDebut: "2027-01-03",
        dateFin: "2027-01-01",
        prixCentimes: 10000,
      }),
    ).rejects.toMatchObject({ code: "PRIX_INVALIDE" });
    await expect(
      casUsage.executer({
        tenantId: "t1",
        logementId: "l1",
        dateDebut: "2027-01-01",
        dateFin: "2027-01-01",
        joursSemaine: [6],
        prixCentimes: 10000,
      }),
    ).rejects.toMatchObject({ code: "PRIX_INVALIDE" });
  });
});
