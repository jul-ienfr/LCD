/**
 * T608 — Port de persistance des demandes d'extras voyageur.
 *
 * L'implémentation Drizzle vit dans
 * `infrastructure/db/repositories/demandes-extra-repository.ts`.
 *
 * Idempotence : `enregistrer` s'appuie sur l'unicité (tenant, ref) — le rejeu
 * d'une même demande renvoie la ligne existante (`cree: false`) au lieu de la
 * dupliquer. Les transitions de statut passent par `marquerStatut`, qui trace
 * qui a décidé et pourquoi en cas de refus.
 */
import type { DemandeExtra, StatutDemandeExtra } from "@/domain/demande-extra";

export interface FiltreDemandesExtra {
  logementId?: string;
  reservationId?: string;
  statut?: StatutDemandeExtra;
}

export interface DemandesExtraRepository {
  /** Enregistre une demande (upsert idempotent par (tenant, ref)). */
  enregistrer(
    tenantId: string,
    demande: DemandeExtra,
  ): Promise<{ id: string; cree: boolean }>;

  trouverParId(tenantId: string, id: string): Promise<DemandeExtra | null>;

  trouverParRef(tenantId: string, ref: string): Promise<DemandeExtra | null>;

  /** Liste les demandes, du plus récent au plus ancien. */
  lister(
    tenantId: string,
    filtre?: FiltreDemandesExtra,
  ): Promise<DemandeExtra[]>;

  listerParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<DemandeExtra[]>;

  /**
   * Applique une décision (validée/refusée/facturée) et retourne la demande à
   * jour, ou `null` si elle est introuvable.
   */
  marquerStatut(
    tenantId: string,
    id: string,
    statut: StatutDemandeExtra,
    options: {
      par: string;
      motifRefus?: string | null;
      maintenant?: string;
    },
  ): Promise<DemandeExtra | null>;
}
