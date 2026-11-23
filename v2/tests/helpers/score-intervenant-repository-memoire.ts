import type { ScoreIntervenantRepository } from "@/application/ports/score-intervenant-repository";
import type { StatsIntervenant } from "@/domain/score-intervenant";

/** Agrégats nuls : chaque test ne renseigne que ce qu'il mesure. */
export function statsIntervenant(
  partiel: Partial<StatsIntervenant> & { userId: string },
): StatsIntervenant {
  return {
    interventions: 0,
    annulees: 0,
    terminees: 0,
    pointagesMesurables: 0,
    pointagesALHeure: 0,
    retardMoyenMinutes: null,
    dureesMesurables: 0,
    dureesConformes: 0,
    ecartMoyenMinutes: null,
    preuvesValideesSansRefus: 0,
    preuvesRefuseesAuMoinsUneFois: 0,
    preuvesEnAttente: 0,
    ...partiel,
  };
}

/**
 * Double mémoire du dépôt de score : les agrégats sont posés par le test
 * (l'agrégation SQL elle-même est vérifiée en base, pas ici).
 */
export class ScoreIntervenantRepositoryMemoire
  implements ScoreIntervenantRepository
{
  private readonly parTenant = new Map<string, StatsIntervenant[]>();
  readonly appels: { tenantId: string; du: string; au: string }[] = [];

  definir(tenantId: string, stats: StatsIntervenant[]): void {
    this.parTenant.set(tenantId, stats);
  }

  async agreger(
    tenantId: string,
    du: string,
    au: string,
  ): Promise<StatsIntervenant[]> {
    this.appels.push({ tenantId, du, au });
    return this.parTenant.get(tenantId) ?? [];
  }
}
