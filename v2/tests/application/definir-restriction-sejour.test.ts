import { beforeEach, describe, expect, it } from "vitest";
import { DefinirRestrictionSejour } from "@/application/use-cases/definir-restriction-sejour";
import { RestrictionSejourRepositoryMemoire } from "../helpers/restriction-sejour-repository-memoire";

const TENANT = "11111111-1111-4111-8111-111111111111";
const LOGEMENT = "22222222-2222-4222-8222-222222222222";

describe("DefinirRestrictionSejour", () => {
  let repository: RestrictionSejourRepositoryMemoire;
  let useCase: DefinirRestrictionSejour;

  beforeEach(() => {
    repository = new RestrictionSejourRepositoryMemoire();
    useCase = new DefinirRestrictionSejour(repository);
  });

  it("enregistre une règle valide", async () => {
    const restriction = await useCase.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      date: "2027-02-01",
      sejourMin: 2,
      sejourMax: 7,
      arriveeAutorisee: false,
      departAutorisee: null,
      stopSell: true,
    });

    expect(restriction).toMatchObject({
      date: "2027-02-01",
      sejourMin: 2,
      sejourMax: 7,
      arriveeAutorisee: false,
      departAutorisee: null,
      stopSell: true,
    });
  });

  it("refuse un minimum supérieur au maximum", async () => {
    await expect(
      useCase.executer({
        tenantId: TENANT,
        logementId: LOGEMENT,
        date: "2027-02-01",
        sejourMin: 8,
        sejourMax: 7,
        arriveeAutorisee: null,
        departAutorisee: null,
        stopSell: null,
      }),
    ).rejects.toThrow("ne peut pas dépasser");
  });

  it("refuse une date invalide", async () => {
    await expect(
      useCase.executer({
        tenantId: TENANT,
        logementId: LOGEMENT,
        date: "2027-02-30",
        sejourMin: 2,
        sejourMax: null,
        arriveeAutorisee: null,
        departAutorisee: null,
        stopSell: null,
      }),
    ).rejects.toThrow("date");
  });

  it("supprime la règle quand tous les champs sont vides", async () => {
    await useCase.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      date: "2027-02-01",
      sejourMin: 2,
      sejourMax: null,
      arriveeAutorisee: null,
      departAutorisee: null,
      stopSell: null,
    });

    const supprimee = await useCase.executer({
      tenantId: TENANT,
      logementId: LOGEMENT,
      date: "2027-02-01",
      sejourMin: null,
      sejourMax: null,
      arriveeAutorisee: null,
      departAutorisee: null,
      stopSell: null,
    });

    expect(supprimee).toBeNull();
    expect(
      await repository.listerParPeriode(
        TENANT,
        LOGEMENT,
        "2027-02-01",
        "2027-02-01",
      ),
    ).toEqual([]);
  });
});
