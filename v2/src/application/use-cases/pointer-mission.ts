/**
 * Pointage début/fin d'une mission (spec 006, FR-031).
 *
 * Le serveur horodate par défaut ; un pointage fait hors ligne peut fournir
 * son horodatage local (validé et marqué `hors_ligne`), et le serveur garde
 * l'instant de réception. La durée réelle est comparée à la durée prévue.
 */
import { ErreurMetier } from "@/domain/erreurs";
import type { Mission, SourcePointage } from "@/domain/mission";
import {
  dureePrevueMinutes,
  dureeReelleMinutes,
  ecartDureeMinutes,
  horodatageLocalValide,
} from "@/domain/pointage";
import type { MissionRepository } from "../ports/mission-repository";

export type SensPointage = "debut" | "fin";

export interface ResultatPointage {
  mission: Mission;
  dureePrevueMinutes: number;
  dureeReelleMinutes: number | null;
  ecartMinutes: number | null;
}

export class PointerMission {
  constructor(private readonly repo: MissionRepository) {}

  async executer(input: {
    tenantId: string;
    missionId: string;
    sens: SensPointage;
    /** Horodatage local fourni après une coupure réseau, ISO 8601. */
    horodatageLocal?: string | null;
    /** Horloge serveur injectée (testable). */
    maintenant: Date;
  }): Promise<ResultatPointage> {
    const mission = await this.repo.trouverParId(
      input.tenantId,
      input.missionId,
    );
    if (!mission) {
      throw new ErreurMetier("MISSION_INVALIDE", "Mission introuvable.");
    }
    if (mission.statut === "annulee") {
      throw new ErreurMetier(
        "MISSION_INVALIDE",
        "Mission annulée : le pointage est impossible.",
      );
    }
    if (input.sens !== "debut" && input.sens !== "fin") {
      throw new ErreurMetier("MISSION_INVALIDE", "Sens de pointage inconnu.");
    }

    // Pointage déjà enregistré : le rejeu est sans effet (client réessayant
    // après une réponse perdue, ou double envoi hors ligne).
    if (input.sens === "debut" && mission.debutReel) {
      return this.resultat(mission);
    }
    if (input.sens === "fin" && mission.finReelle) {
      return this.resultat(mission);
    }

    const local = input.horodatageLocal?.trim() || null;
    if (!horodatageLocalValide(local, input.maintenant)) {
      throw new ErreurMetier(
        "MISSION_INVALIDE",
        "Horodatage hors ligne invalide (date, futur ou trop ancien).",
      );
    }
    const source: SourcePointage = local ? "hors_ligne" : "serveur";
    const at = local ? new Date(local) : input.maintenant;

    if (input.sens === "debut") {
      // Une mission déjà en cours mais jamais pointée (statut posé à la main)
      // reste pointable : le pointage vient alors compléter l'horodatage.
      if (mission.statut !== "planifiee" && mission.statut !== "en_cours") {
        throw new ErreurMetier(
          "MISSION_INVALIDE",
          "Mission déjà terminée ou annulée : le début ne peut plus être pointé.",
        );
      }
      const miseAJour = await this.repo.pointerDebut(
        input.tenantId,
        input.missionId,
        { at, source, recuLe: input.maintenant },
      );
      if (!miseAJour) {
        throw new ErreurMetier("MISSION_INVALIDE", "Pointage impossible.");
      }
      return this.resultat(miseAJour);
    }

    if (mission.statut !== "en_cours" || !mission.debutReel) {
      throw new ErreurMetier(
        "MISSION_INVALIDE",
        "Pointez d'abord le début de la mission.",
      );
    }
    if (at.getTime() < mission.debutReel.getTime()) {
      throw new ErreurMetier(
        "MISSION_INVALIDE",
        "L'heure de fin précède l'heure de début.",
      );
    }
    const miseAJour = await this.repo.pointerFin(
      input.tenantId,
      input.missionId,
      { at, source, recuLe: input.maintenant },
    );
    if (!miseAJour) {
      throw new ErreurMetier("MISSION_INVALIDE", "Pointage impossible.");
    }
    return this.resultat(miseAJour);
  }

  private resultat(mission: Mission): ResultatPointage {
    const prevue = dureePrevueMinutes(
      mission.type,
      mission.dureePrevueMinutes,
    );
    if (!mission.debutReel || !mission.finReelle) {
      return {
        mission,
        dureePrevueMinutes: prevue,
        dureeReelleMinutes: null,
        ecartMinutes: null,
      };
    }
    const reelle = dureeReelleMinutes(mission.debutReel, mission.finReelle);
    return {
      mission,
      dureePrevueMinutes: prevue,
      dureeReelleMinutes: reelle,
      ecartMinutes: ecartDureeMinutes(reelle, prevue),
    };
  }
}
