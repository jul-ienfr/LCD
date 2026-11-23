import type {
  EnregistrerTransitionPreuveData,
  PreuveInterventionRepository,
} from "@/application/ports/preuve-intervention-repository";
import type {
  StatutPreuve,
  TransitionPreuve,
} from "@/domain/preuve-intervention";

export class PreuveInterventionRepositoryMemoire
  implements PreuveInterventionRepository
{
  private readonly rows: TransitionPreuve[] = [];
  private sequence = 0;

  async enregistrer(
    data: EnregistrerTransitionPreuveData,
  ): Promise<TransitionPreuve> {
    this.sequence += 1;
    const transition: TransitionPreuve = {
      id: `transition-${this.sequence}`,
      tenantId: data.tenantId,
      missionId: data.missionId,
      de: data.de,
      vers: data.vers,
      motif: data.motif ?? null,
      qui: data.qui,
      // Horodatage monotone : l'ordre de l'historique est celui des écritures.
      createdAt: new Date(Date.UTC(2026, 0, 1) + this.sequence * 60_000),
    };
    this.rows.push(transition);
    return transition;
  }

  async listerParMission(
    tenantId: string,
    missionId: string,
  ): Promise<TransitionPreuve[]> {
    return this.rows.filter(
      (row) => row.tenantId === tenantId && row.missionId === missionId,
    );
  }

  async listerParMissions(
    tenantId: string,
    missionIds: readonly string[],
  ): Promise<Map<string, TransitionPreuve[]>> {
    const groupes = new Map<string, TransitionPreuve[]>();
    for (const missionId of missionIds) groupes.set(missionId, []);
    for (const row of this.rows) {
      if (row.tenantId !== tenantId) continue;
      groupes.get(row.missionId)?.push(row);
    }
    return groupes;
  }

  /** Utilitaire de test : transitions enregistrées pour une mission. */
  toutes(tenantId: string, missionId: string): TransitionPreuve[] {
    return this.rows.filter(
      (row) => row.tenantId === tenantId && row.missionId === missionId,
    );
  }

  suitesVers(tenantId: string, missionId: string): StatutPreuve[] {
    return this.toutes(tenantId, missionId).map((row) => row.vers);
  }
}
