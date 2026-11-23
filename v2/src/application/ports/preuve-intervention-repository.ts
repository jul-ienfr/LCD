import type {
  StatutPreuve,
  TransitionPreuve,
} from "@/domain/preuve-intervention";

export interface EnregistrerTransitionPreuveData {
  tenantId: string;
  missionId: string;
  de: StatutPreuve | null;
  vers: StatutPreuve;
  motif?: string | null;
  qui: string;
}

export interface PreuveInterventionRepository {
  enregistrer(
    data: EnregistrerTransitionPreuveData,
  ): Promise<TransitionPreuve>;
  /** Historique d'une mission, du plus ancien au plus récent. */
  listerParMission(
    tenantId: string,
    missionId: string,
  ): Promise<TransitionPreuve[]>;
  /**
   * Historiques de plusieurs missions en une requête (FR-027 : pas de N+1 sur
   * les listes). Les missions sans transition ont une entrée vide.
   */
  listerParMissions(
    tenantId: string,
    missionIds: readonly string[],
  ): Promise<Map<string, TransitionPreuve[]>>;
}
