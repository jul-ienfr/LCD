import type {
  RecommandationPrix,
  StatutRecommandation,
} from "@/domain/recommandation-prix";
import type { FacteurPrix, SourcePrix } from "@/domain/recommandation-prix";

export interface RecommandationPrixEnregistree extends RecommandationPrix {
  id: string;
  tenantId: string;
  appliqueeLe: string | null;
  appliqueePar: string | null;
}

export interface EnregistrerRecommandationData {
  logementId: string;
  jour: string;
  prixActuelCentimes: number | null;
  prixRecommandeCentimes: number;
  source: SourcePrix;
  confiance: number;
  facteurs: FacteurPrix[];
  importeeLe: string;
}

export interface FiltreRecommandations {
  logementId?: string;
  debut?: string;
  fin?: string;
  statut?: StatutRecommandation;
  /** Ne renvoyer que les jours dont le prix recommandé dépasse un écart. */
  ecartMinPourcent?: number;
}

export interface RecommandationsPrixRepository {
  /**
   * Import idempotent : une recommandation déjà connue pour
   * (tenant, logement, jour, source) est mise à jour, jamais dupliquée.
   * Retourne le nombre de jours écrits.
   */
  enregistrerImport(
    tenantId: string,
    recommandations: EnregistrerRecommandationData[],
  ): Promise<number>;
  listerParPlage(
    tenantId: string,
    filtre: FiltreRecommandations,
  ): Promise<RecommandationPrixEnregistree[]>;
  trouverParJour(
    tenantId: string,
    logementId: string,
    jour: string,
    source?: SourcePrix,
  ): Promise<RecommandationPrixEnregistree | null>;
  trouverParId(
    tenantId: string,
    id: string,
  ): Promise<RecommandationPrixEnregistree | null>;
  marquerStatut(
    tenantId: string,
    id: string,
    statut: StatutRecommandation,
    par?: string | null,
  ): Promise<RecommandationPrixEnregistree | null>;
  /** Recommandations appliquées, indexées par jour, pour le calcul du prix. */
  prixAppliquesParJour(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
  ): Promise<Map<string, number>>;
}
