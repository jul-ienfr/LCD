/**
 * Agrégats de score par intervenant (spec 006, FR-034).
 *
 * L'agrégation se fait en base (une requête groupée par intervenant) : la
 * période complète n'est jamais chargée en mémoire (FR-026/FR-027).
 */
import type { StatsIntervenant } from "@/domain/score-intervenant";

export interface ScoreIntervenantRepository {
  /** Interventions de `du` à `au` (dates ISO incluses), groupées par intervenant. */
  agreger(
    tenantId: string,
    du: string,
    au: string,
  ): Promise<StatsIntervenant[]>;
}
