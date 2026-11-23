import { describe, expect, it } from "vitest";
import { PointerMission } from "@/application/use-cases/pointer-mission";
import { CreerMission } from "@/application/use-cases/creer-mission";
import { MissionRepositoryMemoire } from "../helpers/mission-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";
const prestaId = "user-presta";

const base = {
  tenantId,
  logementId,
  assignedUserId: prestaId,
  ref: "men-0001",
  type: "menage" as const,
  date: "2026-12-05",
  heure: "10:00",
  notes: null,
};

const MAINTENANT = new Date("2026-12-05T10:00:00Z");
const minutes = (nombre: number) => nombre * 60_000;

describe("PointerMission — pointage serveur", () => {
  it("horodate le début avec l’horloge serveur et passe la mission en cours", async () => {
    const repo = new MissionRepositoryMemoire();
    const mission = await new CreerMission(repo).executer(base);

    const resultat = await new PointerMission(repo).executer({
      tenantId,
      missionId: mission.id,
      sens: "debut",
      maintenant: MAINTENANT,
    });

    expect(resultat.mission.statut).toBe("en_cours");
    expect(resultat.mission.debutReel?.toISOString()).toBe(MAINTENANT.toISOString());
    expect(resultat.mission.debutReelSource).toBe("serveur");
    expect(resultat.mission.debutReelRecuLe?.toISOString()).toBe(MAINTENANT.toISOString());
    expect(resultat.dureePrevueMinutes).toBe(120);
    expect(resultat.dureeReelleMinutes).toBeNull();
  });

  it("calcule la durée réelle et l’écart à la fin du pointage", async () => {
    const repo = new MissionRepositoryMemoire();
    const mission = await new CreerMission(repo).executer(base);
    const uc = new PointerMission(repo);

    await uc.executer({
      tenantId,
      missionId: mission.id,
      sens: "debut",
      maintenant: MAINTENANT,
    });
    const resultat = await uc.executer({
      tenantId,
      missionId: mission.id,
      sens: "fin",
      maintenant: new Date(MAINTENANT.getTime() + minutes(90)),
    });

    expect(resultat.mission.statut).toBe("terminee");
    expect(resultat.dureeReelleMinutes).toBe(90);
    expect(resultat.ecartMinutes).toBe(-30);
  });

  it("applique la durée prévue surchargée de la mission", async () => {
    const repo = new MissionRepositoryMemoire();
    const mission = await new CreerMission(repo).executer(base);
    mission.dureePrevueMinutes = 45;

    const resultat = await new PointerMission(repo).executer({
      tenantId,
      missionId: mission.id,
      sens: "debut",
      maintenant: MAINTENANT,
    });

    expect(resultat.dureePrevueMinutes).toBe(45);
  });
});

describe("PointerMission — pointage hors ligne", () => {
  it("accepte un horodatage local borné, le marque hors ligne et garde la réception serveur", async () => {
    const repo = new MissionRepositoryMemoire();
    const mission = await new CreerMission(repo).executer(base);
    const local = new Date(MAINTENANT.getTime() - minutes(25));

    const resultat = await new PointerMission(repo).executer({
      tenantId,
      missionId: mission.id,
      sens: "debut",
      horodatageLocal: local.toISOString(),
      maintenant: MAINTENANT,
    });

    expect(resultat.mission.debutReel?.toISOString()).toBe(local.toISOString());
    expect(resultat.mission.debutReelSource).toBe("hors_ligne");
    expect(resultat.mission.debutReelRecuLe?.toISOString()).toBe(MAINTENANT.toISOString());
  });

  it("refuse un horodatage local trop en avance sur le serveur", async () => {
    const repo = new MissionRepositoryMemoire();
    const mission = await new CreerMission(repo).executer(base);
    const futur = new Date(MAINTENANT.getTime() + minutes(30));

    await expect(
      new PointerMission(repo).executer({
        tenantId,
        missionId: mission.id,
        sens: "debut",
        horodatageLocal: futur.toISOString(),
        maintenant: MAINTENANT,
      }),
    ).rejects.toMatchObject({ code: "MISSION_INVALIDE" });
    expect((await repo.trouverParId(tenantId, mission.id))?.debutReel).toBeNull();
  });

  it("refuse un horodatage local illisible", async () => {
    const repo = new MissionRepositoryMemoire();
    const mission = await new CreerMission(repo).executer(base);

    await expect(
      new PointerMission(repo).executer({
        tenantId,
        missionId: mission.id,
        sens: "debut",
        horodatageLocal: "ce matin",
        maintenant: MAINTENANT,
      }),
    ).rejects.toMatchObject({ code: "MISSION_INVALIDE" });
  });
});

describe("PointerMission — règles et rejeu", () => {
  it("refuse la fin avant le début pointé", async () => {
    const repo = new MissionRepositoryMemoire();
    const mission = await new CreerMission(repo).executer(base);
    const uc = new PointerMission(repo);

    await uc.executer({
      tenantId,
      missionId: mission.id,
      sens: "debut",
      maintenant: MAINTENANT,
    });

    await expect(
      uc.executer({
        tenantId,
        missionId: mission.id,
        sens: "fin",
        maintenant: new Date(MAINTENANT.getTime() - minutes(5)),
      }),
    ).rejects.toMatchObject({ code: "MISSION_INVALIDE" });
  });

  it("refuse la fin tant que le début n’est pas pointé", async () => {
    const repo = new MissionRepositoryMemoire();
    const mission = await new CreerMission(repo).executer(base);

    await expect(
      new PointerMission(repo).executer({
        tenantId,
        missionId: mission.id,
        sens: "fin",
        maintenant: MAINTENANT,
      }),
    ).rejects.toMatchObject({ code: "MISSION_INVALIDE" });
  });

  it("ignore le rejeu d’un pointage déjà enregistré", async () => {
    const repo = new MissionRepositoryMemoire();
    const mission = await new CreerMission(repo).executer(base);
    const uc = new PointerMission(repo);

    const premier = await uc.executer({
      tenantId,
      missionId: mission.id,
      sens: "debut",
      maintenant: MAINTENANT,
    });
    const rejeu = await uc.executer({
      tenantId,
      missionId: mission.id,
      sens: "debut",
      maintenant: new Date(MAINTENANT.getTime() + minutes(10)),
    });

    expect(rejeu.mission.debutReel?.toISOString()).toBe(
      premier.mission.debutReel?.toISOString(),
    );
    expect(rejeu.mission.statut).toBe("en_cours");
  });

  it("refuse le pointage d’une mission annulée", async () => {
    const repo = new MissionRepositoryMemoire();
    const mission = await new CreerMission(repo).executer(base);
    await repo.changerStatut(tenantId, mission.id, "annulee");

    await expect(
      new PointerMission(repo).executer({
        tenantId,
        missionId: mission.id,
        sens: "debut",
        maintenant: MAINTENANT,
      }),
    ).rejects.toMatchObject({ code: "MISSION_INVALIDE" });
  });

  it("accepte de pointer une mission déjà en cours mais jamais pointée", async () => {
    const repo = new MissionRepositoryMemoire();
    const mission = await new CreerMission(repo).executer(base);
    await repo.changerStatut(tenantId, mission.id, "en_cours");

    const resultat = await new PointerMission(repo).executer({
      tenantId,
      missionId: mission.id,
      sens: "debut",
      maintenant: MAINTENANT,
    });

    expect(resultat.mission.debutReel?.toISOString()).toBe(MAINTENANT.toISOString());
  });

  it("refuse une mission inconnue", async () => {
    await expect(
      new PointerMission(new MissionRepositoryMemoire()).executer({
        tenantId,
        missionId: "00000000-0000-4000-8000-000000000000",
        sens: "debut",
        maintenant: MAINTENANT,
      }),
    ).rejects.toMatchObject({ code: "MISSION_INVALIDE" });
  });
});
