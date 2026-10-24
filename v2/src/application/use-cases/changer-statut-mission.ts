import { ErreurMetier } from "@/domain/erreurs";
import {
  TRANSITIONS_MISSION,
  type StatutMission,
} from "@/domain/mission";
import type { MissionRepository } from "../ports/mission-repository";

export class ChangerStatutMission {
  constructor(private readonly repo: MissionRepository) {}

  async executer(input: {
    tenantId: string;
    missionId: string;
    statut: StatutMission;
  }) {
    const mission = await this.repo.trouverParId(
      input.tenantId,
      input.missionId,
    );
    if (!mission) {
      throw new ErreurMetier("MISSION_INVALIDE", "Mission introuvable.");
    }
    if (mission.statut === input.statut) return mission;

    if (!TRANSITIONS_MISSION[mission.statut].includes(input.statut)) {
      throw new ErreurMetier(
        "MISSION_INVALIDE",
        `Transition ${mission.statut} → ${input.statut} interdite.`,
      );
    }

    const miseAJour = await this.repo.changerStatut(
      input.tenantId,
      input.missionId,
      input.statut,
    );
    if (!miseAJour) {
      throw new ErreurMetier("MISSION_INVALIDE", "Mise à jour impossible.");
    }
    return miseAJour;
  }
}
