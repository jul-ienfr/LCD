import type { FacteurPrix, SourcePrix } from "@/domain/recommandation-prix";

/** Recommandation brute renvoyée par un partenaire de revenue management. */
export interface RecommandationPartenaire {
  jour: string;
  prixCentimes: number;
  confiance: number;
  facteurs: FacteurPrix[];
}

export interface DemandeImportPrix {
  logementId: string;
  /** Identifiant partenaire du logement (facultatif : certains partenaires
   *  raisonnent par identifiant interne). */
  referencePartenaire?: string;
  debut: string;
  fin: string;
}

/**
 * Port de revenue management : une seule méthode d'import. Les partenaires
 * (PriceLabs, Beyond, etc.) sont derrière des adapters interchangeables.
 */
export interface PricingPort {
  readonly source: SourcePrix;
  readonly nom: string;
  estDisponible(): boolean;
  importer(demande: DemandeImportPrix): Promise<RecommandationPartenaire[]>;
}
