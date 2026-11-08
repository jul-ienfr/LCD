import { beforeEach, describe, expect, it } from "vitest";
import { DefinirPlageRestrictions } from "@/application/use-cases/definir-plage-restrictions";
import { RestrictionSejourRepositoryMemoire } from "../helpers/restriction-sejour-repository-memoire";

const TENANT = "11111111-1111-4111-8111-111111111111";
const LOGEMENT = "22222222-2222-4222-8222-222222222222";

describe("DefinirPlageRestrictions", () => {
  let repository: RestrictionSejourRepositoryMemoire;
  let useCase: DefinirPlageRestrictions;

  beforeEach(() => {
    repository = new RestrictionSejourRepositoryMemoire();
    useCase = new DefinirPlageRestrictions(repository);
  });

  it("applique la règle à toute la plage", async () => {
    const resultat = await useCase.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      dateDebut: "2027-02-01",
      dateFin: "2027-02-03",
      sejourMin: 2,
      sejourMax: null,
      arriveeAutorisee: null,
      departAutorisee: null,
      stopSell: null,
    });

    expect(resultat).toEqual({
      dates: ["2027-02-01", "2027-02-02", "2027-02-03"],
      supprimees: 0,
    });
    const lignes = await repository.listerParPeriode(
      TENANT,
      LOGEMENT,
      "2027-02-01",
      "2027-02-03",
    );
    expect(lignes).toHaveLength(3);
    expect(lignes.every((ligne) => ligne.sejourMin === 2)).toBe(true);
  });

  it("ne retient que les jours de semaine demandés", async () => {
    const resultat = await useCase.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      dateDebut: "2027-02-01",
      dateFin: "2027-02-08",
      joursSemaine: [1],
      sejourMin: 3,
      sejourMax: null,
      arriveeAutorisee: null,
      departAutorisee: null,
      stopSell: null,
    });

    expect(resultat.dates).toEqual(["2027-02-01", "2027-02-08"]);
    expect(
      await repository.listerParPeriode(
        TENANT,
        LOGEMENT,
        "2027-02-01",
        "2027-02-08",
      ),
    ).toHaveLength(2);
  });

  it("supprime toutes les dates de la plage quand les valeurs sont vides", async () => {
    await useCase.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      dateDebut: "2027-02-01",
      dateFin: "2027-02-03",
      sejourMin: 2,
      sejourMax: null,
      arriveeAutorisee: null,
      departAutorisee: null,
      stopSell: null,
    });

    const resultat = await useCase.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      dateDebut: "2027-02-01",
      dateFin: "2027-02-03",
      sejourMin: null,
      sejourMax: null,
      arriveeAutorisee: null,
      departAutorisee: null,
      stopSell: null,
    });

    expect(resultat.supprimees).toBe(3);
    expect(
      await repository.listerParPeriode(
        TENANT,
        LOGEMENT,
        "2027-02-01",
        "2027-02-03",
      ),
    ).toEqual([]);
  });

  it("refuse une plage sans date correspondante", async () => {
    await expect(
      useCase.executer({
        tenantId: TENANT,
        logementId: LOGEMENT,
        dateDebut: "2027-02-02",
        dateFin: "2027-02-02",
        joursSemaine: [1],
        sejourMin: 2,
        sejourMax: null,
        arriveeAutorisee: null,
        departAutorisee: null,
        stopSell: null,
      }),
    ).rejects.toThrow("Aucune date");
  });
});
