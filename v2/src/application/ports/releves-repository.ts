/**
 * T501 — Ports pour les relevés propriétaires.
 *
 * `RelevesRepository` gère la persistance des relevés générés.
 * `EnvoisRelevesRepository` trace les envois (email, portail) avec idempotence.
 */

import type { ReleveProprietaire } from "@/domain/releve-proprietaire";

// --- RelevesRepository ---

export interface ReleveEnregistre {
  id: string;
  tenantId: string;
  proprietaireId: string;
  proprietaireNom: string;
  moisDebut: string;
  moisFin: string;
  periode: string;
  lignes: unknown[];
  totalCaCentimes: number;
  totalCommissionCentimes: number;
  totalChargesCentimes: number;
  totalNetCentimes: number;
  genereAt: string;
  creeAt: Date;
}

export interface RelevesRepository {
  /**
   * Enregistre un relevé. Idempotent par (tenantId, proprietaireId, moisDebut, periode).
   * Retourne le relevé existant si déjà présent.
   */
  enregistrer(
    tenantId: string,
    releve: ReleveProprietaire,
  ): Promise<{ id: string; cree: boolean }>;

  /** Trouve un relevé par identifiant. */
  trouverParId(
    tenantId: string,
    releveId: string,
  ): Promise<ReleveProprietaire | null>;

  /** Trouve un relevé par période. */
  trouverParPeriode(
    tenantId: string,
    proprietaireId: string,
    moisDebut: string,
    periode: string,
  ): Promise<ReleveProprietaire | null>;

  /** Liste les relevés d'un propriétaire, du plus récent au plus ancien. */
  listerParProprietaire(
    tenantId: string,
    proprietaireId: string,
    limite?: number,
  ): Promise<ReleveProprietaire[]>;

  /** Liste les relevés d'un tenant (pour l'écran /hote/rapports). */
  listerParTenant(
    tenantId: string,
    options?: { moisDebut?: string; moisFin?: string },
  ): Promise<ReleveProprietaire[]>;
}

// --- EnvoisRelevesRepository ---

export interface EnvoiReleve {
  id: string;
  tenantId: string;
  releveId: string;
  proprietaireId: string;
  canal: "email" | "portail";
  destinataire: string;
  envoiRef: string;
  envoyeAt: string;
  statut: "envoye" | "echec" | "consulte" | "telecharge";
  erreur: string | null;
}

export interface EnvoisRelevesRepository {
  /**
   * Trace un envoi de relevé. Idempotent par envoiRef.
   */
  enregistrer(
    tenantId: string,
    envoi: Omit<EnvoiReleve, "id">,
  ): Promise<{ id: string; cree: boolean }>;

  /** Liste les envois d'un relevé. */
  listerParReleve(
    tenantId: string,
    releveId: string,
  ): Promise<EnvoiReleve[]>;

  /** Trouve le dernier envoi par ref (pour idempotence). */
  trouverParRef(
    tenantId: string,
    envoiRef: string,
  ): Promise<EnvoiReleve | null>;

  /** Met à jour le statut d'un envoi (consulté, téléchargé). */
  mettreAJourStatut(
    tenantId: string,
    envoiId: string,
    statut: EnvoiReleve["statut"],
  ): Promise<void>;
}
