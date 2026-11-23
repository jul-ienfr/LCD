/**
 * Score par intervenant (spec 006, FR-034).
 *
 * Le dépôt agrège les interventions de la période en base ; ce cas d'usage
 * transforme les agrégats en scores et les ordonne. Aucune donnée brute de
 * mission ne remonte ici : la période complète n'est jamais chargée.
 */
import {
  calculerScore,
  comparerScores,
  type ScoreIntervenant,
} from "@/domain/score-intervenant";
import type { ScoreIntervenantRepository } from "../ports/score-intervenant-repository";

export class CalculerScoresIntervenants {
  constructor(private readonly depot: ScoreIntervenantRepository) {}

  async executer(input: {
    tenantId: string;
    /** Premier jour inclus, ISO `AAAA-MM-JJ`. */
    du: string;
    /** Dernier jour inclus, ISO `AAAA-MM-JJ`. */
    au: string;
  }): Promise<ScoreIntervenant[]> {
    const stats = await this.depot.agreger(input.tenantId, input.du, input.au);
    return stats.map(calculerScore).sort(comparerScores);
  }
}
