import { describe, expect, it } from "vitest";
import { ChangerStatutMission } from "@/application/use-cases/changer-statut-mission";
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
  notes: "Ménage de départ",
};

describe("missions", () => {
  it("crée une mission valide", async () => {
    const mission = await new CreerMission(
      new MissionRepositoryMemoire(),
    ).executer(base);
    expect(mission.ref).toBe("men-0001");
    expect(mission.statut).toBe("planifiee");
    expect(mission.heure).toBe("10:00");
  });

  it("refuse une heure invalide", async () => {
    await expect(
      new CreerMission(new MissionRepositoryMemoire()).executer({
        ...base,
        heure: "25:00",
      }),
    ).rejects.toMatchObject({ code: "MISSION_INVALIDE" });
  });

  it("suit planifiée → en cours → terminée", async () => {
    const repo = new MissionRepositoryMemoire();
    const mission = await new CreerMission(repo).executer(base);
    const uc = new ChangerStatutMission(repo);

    expect(
      (await uc.executer({
        tenantId,
        missionId: mission.id,
        statut: "en_cours",
      })).statut,
    ).toBe("en_cours");

    expect(
      (await uc.executer({
        tenantId,
        missionId: mission.id,
        statut: "terminee",
      })).statut,
    ).toBe("terminee");
  });

  it("refuse terminée → en cours", async () => {
    const repo = new MissionRepositoryMemoire();
    const mission = await new CreerMission(repo).executer(base);
    const uc = new ChangerStatutMission(repo);
    await uc.executer({ tenantId, missionId: mission.id, statut: "en_cours" });
    await uc.executer({ tenantId, missionId: mission.id, statut: "terminee" });

    await expect(
      uc.executer({ tenantId, missionId: mission.id, statut: "en_cours" }),
    ).rejects.toMatchObject({ code: "MISSION_INVALIDE" });
  });
});
