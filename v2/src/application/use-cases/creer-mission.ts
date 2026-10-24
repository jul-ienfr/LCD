import { ErreurMetier } from "@/domain/erreurs";
import {
  missionValide,
  type TypeMission,
} from "@/domain/mission";
import type { MissionRepository } from "../ports/mission-repository";

export interface CreerMissionInput {
  tenantId: string;
  logementId: string;
  reservationId?: string | null;
  assignedUserId: string;
  ref: string;
  type: TypeMission;
  date: string;
  heure?: string | null;
  notes?: string | null;
}

export class CreerMission {
  constructor(private readonly repo: MissionRepository) {}

  async executer(input: CreerMissionInput) {
    const ref = input.ref.trim();
    const heure = input.heure?.trim() || null;
    const notes = input.notes?.trim() || null;

    if (!missionValide({ ref, date: input.date, heure, type: input.type })) {
      throw new ErreurMetier(
        "MISSION_INVALIDE",
        "Référence, date, heure ou type de mission invalide.",
      );
    }
    if (!input.logementId || !input.assignedUserId) {
      throw new ErreurMetier(
        "MISSION_INVALIDE",
        "Logement et prestataire requis.",
      );
    }
    if (notes && notes.length > 2000) {
      throw new ErreurMetier(
        "MISSION_INVALIDE",
        "Les notes sont limitées à 2000 caractères.",
      );
    }

    return this.repo.creer({
      tenantId: input.tenantId,
      logementId: input.logementId,
      reservationId: input.reservationId ?? null,
      assignedUserId: input.assignedUserId,
      ref,
      type: input.type,
      date: input.date,
      heure,
      notes,
    });
  }
}
