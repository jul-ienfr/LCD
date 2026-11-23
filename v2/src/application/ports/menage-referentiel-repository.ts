import type { PieceReferentiel } from "@/domain/menage";

/**
 * Référentiel de checklist d'un logement (spec 006, FR-035) : les pièces du
 * logement et les tâches de chacune. Une seule version par logement, remplacée
 * en bloc — un référentiel vide signifie « jamais configuré », et le domaine
 * prend alors le modèle par défaut.
 */
export interface MenageReferentielRepository {
  /** `[]` quand le logement n'a jamais eu de référentiel. */
  listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<PieceReferentiel[]>;

  /** Remplace le référentiel du logement ; `[]` le remet au modèle par défaut. */
  remplacer(
    tenantId: string,
    logementId: string,
    pieces: readonly PieceReferentiel[],
  ): Promise<void>;
}
