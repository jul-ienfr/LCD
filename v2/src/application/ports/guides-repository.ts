/**
 * T602 — Ports de persistance du guide voyageur et de l'accès serrure.
 *
 * L'implémentation Drizzle vit dans
 * `infrastructure/db/repositories/guides-repository.ts`.
 *
 * `GuideContenusRepository` gère le contenu multilingue des sections du guide.
 * L'idempotence est garantie par l'unique (tenant, logement, section, langue) :
 * un upsert remplace le contenu existant sans dupliquer.
 *
 * `AccesSerrureRepository` gère les codes d'accès (numériques ou manuels).
 */
import type {
  LangueGuide,
  SectionGuide,
} from "@/domain/guide-voyageur";

// --- Données projetées ---

export interface GuideContenuRow {
  id: string;
  tenantId: string;
  logementId: string;
  section: SectionGuide;
  langue: LangueGuide;
  titre: string;
  corps: string;
}

export interface AccesSerrureRow {
  id: string;
  tenantId: string;
  logementId: string;
  reservationId: string | null;
  /** Référence stable et rejouable (migration 0097). */
  ref: string;
  type: "numerique" | "manuel";
  code: string | null;
  statut: "actif" | "revoque" | "expire";
  fournisseur: string | null;
  /** Fenêtre d'ouverture du code (migration 0097), en ISO. */
  valideDe: string;
  valideA: string;
  expireLe: string | null;
  note: string | null;
  revoqueLe: string | null;
  revoquePar: string | null;
  /** Identifiant du code chez la serrure connectée (Nuki). */
  externalId: string | null;
}

// --- GuideContenusRepository ---

export interface GuideContenusRepository {
  /**
   * Enregistre ou remplace le contenu d'une section pour un logement et une
   * langue (upsert idempotent par (tenant, logement, section, langue)).
   * Retourne l'id de la ligne.
   */
  enregistrer(
    tenantId: string,
    data: {
      logementId: string;
      section: SectionGuide;
      langue: LangueGuide;
      titre: string;
      corps: string;
    },
  ): Promise<{ id: string; cree: boolean }>;

  /** Liste tous les contenus du guide d'un logement. */
  listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<GuideContenuRow[]>;

  /** Trouve le contenu d'une section pour une langue précise. */
  trouverParSectionLangue(
    tenantId: string,
    logementId: string,
    section: SectionGuide,
    langue: LangueGuide,
  ): Promise<GuideContenuRow | null>;

  /** Supprime le contenu d'une section pour une langue. */
  supprimer(
    tenantId: string,
    logementId: string,
    section: SectionGuide,
    langue: LangueGuide,
  ): Promise<void>;
}

// --- AccesSerrureRepository ---

export interface AccesSerrureRepository {
  /**
   * Crée un code d'accès pour un logement (et éventuellement une réservation).
   */
  creer(
    tenantId: string,
    data: {
      logementId: string;
      reservationId?: string | null;
      /** Référence stable : un rejeu renvoie la ligne existante. */
      ref: string;
      type: "numerique" | "manuel";
      code?: string | null;
      fournisseur?: string | null;
      /** Fenêtre d'ouverture du code (ISO). */
      valideDe: string;
      valideA: string;
      expireLe?: string | null;
      note?: string | null;
      externalId?: string | null;
    },
  ): Promise<{ id: string; cree: boolean }>;

  /** Retrouve un accès par sa référence stable (idempotence). */
  trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<AccesSerrureRow | null>;

  /** Trouve un accès par identifiant. */
  trouverParId(
    tenantId: string,
    accesId: string,
  ): Promise<AccesSerrureRow | null>;

  /** Liste les accès d'un logement, du plus récent au plus ancien. */
  listerParLogement(
    tenantId: string,
    logementId: string,
    options?: { statut?: AccesSerrureRow["statut"] },
  ): Promise<AccesSerrureRow[]>;

  /** Liste les accès actifs d'une réservation. */
  listerParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<AccesSerrureRow[]>;

  /**
   * Révoque un accès (statut → `revoque`) en traçant qui l'a demandé.
   * Retourne `null` si l'accès est introuvable.
   */
  revoquer(
    tenantId: string,
    accesId: string,
    options: { par: string; maintenant?: string },
  ): Promise<AccesSerrureRow | null>;
}
