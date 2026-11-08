import type {
  CapacitesFournisseur,
  CodeFournisseur,
  ModeFournisseur,
} from "@/domain/fournisseur";

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
  verifierWebhook(entree: EntreeWebhook): Promise<boolean>;
}
