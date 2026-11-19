import type { StatutEvenementStripe } from "@/domain/evenement-stripe";

/** Trace persistée d'un événement Stripe reçu (FR-024). */
export interface EvenementStripeTrace {
  id: string;
  /** Identifiant Stripe (`evt_...`) : clé d'idempotence de la trace. */
  evenementId: string;
  /** Type du port (`paiement_reussi`, `litige`, `autre`). */
  type: string;
  /** Identifiant de l'objet Stripe concerné (session `cs_...`, litige `dp_...`). */
  objetId: string | null;
  statut: StatutEvenementStripe;
  /** Événement normalisé (forme du port), suffisant pour rejouer sans re-signature. */
  evenement: Record<string, unknown>;
  erreur: string | null;
  tentatives: number;
  recuLe: Date;
  derniereTentativeLe: Date;
  traiteLe: Date | null;
  rejoueLe: Date | null;
}

export interface CreerEvenementStripeData {
  evenementId: string;
  type: string;
  objetId?: string | null;
  /** Événement normalisé (forme du port), conservé pour le rejeu. */
  evenement: Record<string, unknown>;
}

export interface ResultatEnregistrementEvenementStripe {
  trace: EvenementStripeTrace;
  /** false = l'événement était déjà tracé (rejeu Stripe ou manuel). */
  cree: boolean;
}

export interface MarquerStatutEvenementStripeData {
  statut: StatutEvenementStripe;
  erreur?: string | null;
  /** true = nouvelle tentative de traitement : `tentatives` est incrémenté. */
  retentative?: boolean;
  /** true = rejeu déclenché par l'exploitant depuis /supervision. */
  rejoue?: boolean;
}

/**
 * Trace des événements Stripe (FR-024). L'enregistrement est idempotent par
 * identifiant d'événement : un retry Stripe ne crée jamais deux traces.
 */
export interface EvenementsStripeRepository {
  enregistrer(
    data: CreerEvenementStripeData,
  ): Promise<ResultatEnregistrementEvenementStripe>;
  trouverParEvenementId(evenementId: string): Promise<EvenementStripeTrace | null>;
  marquerStatut(
    evenementId: string,
    data: MarquerStatutEvenementStripeData,
  ): Promise<EvenementStripeTrace | null>;
  /** Derniers événements reçus, du plus récent au plus ancien. */
  listerRecents(limite: number): Promise<EvenementStripeTrace[]>;
  /**
   * Événements à rejouer : en échec, plus les événements « recu » bloqués
   * (traitement interrompu depuis plus de 10 minutes).
   */
  listerEchoues(limite: number): Promise<EvenementStripeTrace[]>;
  /** Compte des événements à rejouer (même périmètre que `listerEchoues`). */
  compterEchoues(): Promise<number>;
}
