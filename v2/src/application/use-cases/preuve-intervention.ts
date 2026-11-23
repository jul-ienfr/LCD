/**
 * Cycle de preuve d'intervention (spec 006, FR-032 et FR-033).
 *
 * Trois gestes sur la même boucle :
 * - `SoumettrePreuveIntervention` (intervenant, ou gérante à sa place) ;
 * - `ValiderPreuveIntervention` (gérante) ;
 * - `RefuserPreuveIntervention` (gérante, motif obligatoire).
 *
 * Chaque passage est historisé ; un refus renvoie la mission en reprise avec
 * son motif, que l'intervenant voit pour corriger et resoumettre.
 */
import { ErreurMetier } from "@/domain/erreurs";
import type { Mission } from "@/domain/mission";
import {
  exigerMissionTerminee,
  exigerTransitionPreuve,
  validerMotifRefus,
  type StatutPreuve,
  type TransitionPreuve,
} from "@/domain/preuve-intervention";
import type { MissionRepository } from "../ports/mission-repository";
import type { PreuveInterventionRepository } from "../ports/preuve-intervention-repository";

export interface ResultatPreuve {
  mission: Mission;
  transition: TransitionPreuve;
}

abstract class UseCasePreuve {
  constructor(
    protected readonly missions: MissionRepository,
    protected readonly preuves: PreuveInterventionRepository,
  ) {}

  protected async charger(tenantId: string, missionId: string) {
    const mission = await this.missions.trouverParId(tenantId, missionId);
    if (!mission) {
      throw new ErreurMetier("PREUVE_INVALIDE", "Mission introuvable.");
    }
    return mission;
  }

  protected async historiser(input: {
    mission: Mission;
    de: StatutPreuve;
    vers: StatutPreuve;
    motif?: string | null;
    qui: string;
  }): Promise<TransitionPreuve> {
    return this.preuves.enregistrer({
      tenantId: input.mission.tenantId,
      missionId: input.mission.id,
      de: input.de,
      vers: input.vers,
      motif: input.motif ?? null,
      qui: input.qui,
    });
  }
}

export class SoumettrePreuveIntervention extends UseCasePreuve {
  async executer(input: {
    tenantId: string;
    missionId: string;
    qui: string;
    maintenant: Date;
  }): Promise<ResultatPreuve> {
    const mission = await this.charger(input.tenantId, input.missionId);
    const de = mission.preuveStatut;
    exigerTransitionPreuve(de, "soumise");
    exigerMissionTerminee(mission);

    const misAJour = await this.missions.soumettrePreuve(
      input.tenantId,
      mission.id,
      { le: input.maintenant },
    );
    if (!misAJour) {
      throw new ErreurMetier("PREUVE_INVALIDE", "Soumission impossible.");
    }
    const transition = await this.historiser({
      mission,
      de,
      vers: "soumise",
      qui: input.qui,
    });
    return { mission: misAJour, transition };
  }
}

export class ValiderPreuveIntervention extends UseCasePreuve {
  async executer(input: {
    tenantId: string;
    missionId: string;
    qui: string;
    maintenant: Date;
  }): Promise<ResultatPreuve> {
    const mission = await this.charger(input.tenantId, input.missionId);
    const de = mission.preuveStatut;
    exigerTransitionPreuve(de, "validee");

    const misAJour = await this.missions.validerPreuve(
      input.tenantId,
      mission.id,
      { le: input.maintenant, par: input.qui },
    );
    if (!misAJour) {
      throw new ErreurMetier("PREUVE_INVALIDE", "Validation impossible.");
    }
    const transition = await this.historiser({
      mission,
      de,
      vers: "validee",
      qui: input.qui,
    });
    return { mission: misAJour, transition };
  }
}

export class RefuserPreuveIntervention extends UseCasePreuve {
  async executer(input: {
    tenantId: string;
    missionId: string;
    motif: string;
    qui: string;
    maintenant: Date;
  }): Promise<ResultatPreuve> {
    const mission = await this.charger(input.tenantId, input.missionId);
    const de = mission.preuveStatut;
    const motif = validerMotifRefus(input.motif);
    exigerTransitionPreuve(de, "refusee");

    const misAJour = await this.missions.refuserPreuve(
      input.tenantId,
      mission.id,
      { le: input.maintenant, par: input.qui, motif },
    );
    if (!misAJour) {
      throw new ErreurMetier("PREUVE_INVALIDE", "Refus impossible.");
    }
    const transition = await this.historiser({
      mission,
      de,
      vers: "refusee",
      motif,
      qui: input.qui,
    });
    return { mission: misAJour, transition };
  }
}
