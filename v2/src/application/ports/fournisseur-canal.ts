import type {
  CapacitesFournisseur,
  CodeFournisseur,
  ModeFournisseur,
} from "@/domain/fournisseur";
import type { SanteConnexion } from "@/domain/canal";

export interface LogementExterne {
  externalId: string;
  nom: string;
  externalRoomTypeId?: string | null;
}

export type StatutReservationExterne =
  | "confirmee"
  | "annulee"
  | "en_attente";

export interface ReservationExterne {
  externalId: string;
  externalPropertyId: string;
  /** Identifiant de chambre/type de chambre si le fournisseur le distingue. */
  externalRoomTypeId?: string | null;
  reference: string;
  arrivee: string;
  depart: string;
  statut: StatutReservationExterne;
  clientNom: string | null;
  clientEmail: string | null;
  montantCentimes: number | null;
  devise: string | null;
}

export interface DisponibiliteJour {
  externalPropertyId: string;
  externalRoomTypeId?: string | null;
  date: string;
  disponible: boolean;
  prixCentimes?: number | null;
}

export interface TarifJour {
  externalPropertyId: string;
  externalRoomTypeId?: string | null;
  externalRatePlanId?: string | null;
  date: string;
  prixCentimes: number;
  devise: string;
}

export interface RestrictionJour {
  externalPropertyId: string;
  externalRoomTypeId?: string | null;
  externalRatePlanId?: string | null;
  date: string;
  sejourMin?: number;
  sejourMax?: number;
  arriveeAutorisee?: boolean;
  departAutorisee?: boolean;
  stopSell?: boolean;
  prixCentimes?: number | null;
}

export interface ResultatTestFournisseur {
  ok: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export interface EntreeWebhook {
  headers: Headers;
  corps: string;
}

export type SensMessageCanal = "entrant" | "sortant";

export interface MessageCanalExterne {
  /** Identifiant du message côté fournisseur. */
  externalId: string;
  externalPropertyId: string | null;
  /** Identifiant de réservation fourni si le message y est rattaché. */
  externalReservationId?: string | null;
  sens: SensMessageCanal;
  auteur: string | null;
  corps: string;
  creeAt: string;
}

export interface FournisseurCanal {
  readonly code: CodeFournisseur;
  readonly mode: ModeFournisseur;
  readonly capacites: CapacitesFournisseur;
  testerConnexion(): Promise<ResultatTestFournisseur>;
  listerLogements(): Promise<LogementExterne[]>;
  recupererReservations(
    depuis: string,
    jusqua: string,
    externalPropertyId?: string,
  ): Promise<ReservationExterne[]>;
  pousserDisponibilites(
    changements: readonly DisponibiliteJour[],
  ): Promise<void>;
  pousserTarifs(tarifs: readonly TarifJour[]): Promise<void>;
  pousserRestrictions(
    restrictions: readonly RestrictionJour[],
  ): Promise<void>;
  /**
   * Lecture de l'état ARI distant, utilisée pour ne pousser que les différences
   * (T110). Optionnel : sans lecture, l'adaptateur reçoit l'état complet.
   */
  lireDisponibilites?(
    debut: string,
    fin: string,
    externalPropertyId?: string,
  ): Promise<DisponibiliteJour[]>;
  lireTarifs?(
    debut: string,
    fin: string,
    externalPropertyId?: string,
  ): Promise<TarifJour[]>;
  lireRestrictions?(
    debut: string,
    fin: string,
    externalPropertyId?: string,
  ): Promise<RestrictionJour[]>;
  verifierWebhook(entree: EntreeWebhook): Promise<boolean>;
  /**
   * Santé de la connexion côté fournisseur (T102). Optionnel : les adapters
   * qui n'exposent pas d'endpoint santé ne l'implémentent pas ; l'appelant
   * retombe alors sur la santé déduite de la base (dernier statut de sync).
   */
  lireSante?(externalPropertyId?: string): Promise<SanteConnexion | null>;
  /**
   * Lecture des messages OTA si le fournisseur expose le messaging.
   * Absent quand `capacites.messaging` est faux.
   */
  lireMessages?(
    depuis: string,
    externalPropertyId?: string,
  ): Promise<MessageCanalExterne[]>;
  /** Envoi d'un message au voyageur via le fournisseur. */
  envoyerMessage?(input: {
    externalPropertyId: string;
    externalReservationId: string;
    corps: string;
    cleIdempotence: string;
  }): Promise<{ externalId: string }>;
}
