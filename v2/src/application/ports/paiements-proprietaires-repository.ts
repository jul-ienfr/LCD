/**
 * T515 — Port de persistance des paiements propriétaires (payouts).
 *
 * L'implémentation Drizzle vit dans
 * `infrastructure/db/repositories/paiements-proprietaires-repository.ts`.
 * L'idempotence est garantie par la référence `ref` unique par tenant.
 */
import type { PayoutProprietaire } from "@/domain/paiement-proprietaire";

export interface PaiementsProprietairesRepository {
  /**
   * Enregistre un payout. Idempotent par (tenantId, ref) : un rejeu
   * retourne le payout existant avec `cree: false`.
   */
  enregistrer(
    tenantId: string,
    payout: PayoutProprietaire,
  ): Promise<{ id: string; cree: boolean }>;

  /** Trouve un payout par identifiant. */
  trouverParId(
    tenantId: string,
    payoutId: string,
  ): Promise<PayoutProprietaire | null>;

  /** Trouve un payout par référence idempotente. */
  trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<PayoutProprietaire | null>;

  /** Liste les payouts d'un propriétaire, du plus récent au plus ancien. */
  listerParProprietaire(
    tenantId: string,
    proprietaireId: string,
    limite?: number,
  ): Promise<PayoutProprietaire[]>;

  /** Liste les payouts rattachés à un relevé. */
  listerParReleve(
    tenantId: string,
    releveId: string,
  ): Promise<PayoutProprietaire[]>;

  /** Liste les payouts d'un tenant, du plus récent au plus ancien. */
  listerParTenant(
    tenantId: string,
    options?: { statut?: PayoutProprietaire["statut"] },
  ): Promise<PayoutProprietaire[]>;

  /**
   * Met à jour le statut et, le cas échéant, le montant payé, la date de
   * paiement et la note. Retourne le payout mis à jour ou null s'il est
   * introuvable.
   */
  mettreAJour(
    tenantId: string,
    payoutId: string,
    data: {
      statut: PayoutProprietaire["statut"];
      montantPayeCentimes?: number | null;
      datePaiement?: string | null;
      note?: string | null;
    },
  ): Promise<PayoutProprietaire | null>;
}
