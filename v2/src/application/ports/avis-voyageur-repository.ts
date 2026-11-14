/**
 * T609 — Port de persistance des avis voyageur.
 *
 * L'implémentation Drizzle vit dans
 * `infrastructure/db/repositories/avis-voyageur-repository.ts`.
 *
 * Un avis est créé en statut `invite` (invitation J+1) ; il devient `recu`
 * quand le voyageur dépose sa note, `publie` quand le staff le publie, et
 * `masque` en cas de contenu abusif. Aucune publication automatique : le
 * domaine ne cache jamais un avis négatif, mais l'affichage reste une décision
 * humaine.
 */
import type { AvisVoyageur, StatutAvis } from "@/domain/avis-voyageur";

export interface FiltreAvis {
  logementId?: string;
  statut?: StatutAvis;
}

export interface AvisVoyageurRepository {
  /**
   * Crée l'invitation (upsert idempotent par (tenant, ref) et par
   * (tenant, reservation_id)). Retourne la ligne et si elle a été créée.
   */
  enregistrer(
    tenantId: string,
    avis: AvisVoyageur,
  ): Promise<{ id: string; cree: boolean }>;

  trouverParId(tenantId: string, id: string): Promise<AvisVoyageur | null>;

  trouverParRef(tenantId: string, ref: string): Promise<AvisVoyageur | null>;

  trouverParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<AvisVoyageur | null>;

  /** Liste les avis, du plus récent au plus ancien. */
  lister(tenantId: string, filtre?: FiltreAvis): Promise<AvisVoyageur[]>;

  /** Avis publiés d'un logement, du plus récent au plus ancien. */
  listerPublies(tenantId: string, logementId: string): Promise<AvisVoyageur[]>;

  /**
   * Met à jour un avis existant (note, commentaire, statut, réponse, dates) en
   * le retrouvant par son identifiant. Retourne `null` si introuvable.
   */
  mettreAJour(
    tenantId: string,
    avis: AvisVoyageur,
  ): Promise<AvisVoyageur | null>;
}
