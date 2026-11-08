import type {
  CanalFil,
  ConsentementsFil,
  FilVoyageur,
  SensMessage,
  StatutFil,
} from "@/domain/fil-voyageur";

export interface CreerFilData {
  tenantId: string;
  logementId?: string | null;
  reservationId?: string | null;
  voyageurNom: string;
  voyageurEmail?: string | null;
  voyageurTelephone?: string | null;
  langue?: string;
  cleRegroupement: string;
  consentements?: ConsentementsFil;
}

export interface MettreAJourFilData {
  logementId?: string | null;
  reservationId?: string | null;
  voyageurNom?: string;
  voyageurEmail?: string | null;
  voyageurTelephone?: string | null;
  langue?: string;
  statut?: StatutFil;
  consentements?: ConsentementsFil;
  dernierMessageAt?: Date | null;
}

export interface CreerMessageFilData {
  tenantId: string;
  filId: string;
  ref: string;
  canal: CanalFil;
  sens: SensMessage;
  contenu: string;
  destinataire?: string | null;
  expediteur?: string | null;
  externalId?: string | null;
  statut?: string;
  envoyeAt?: Date | null;
}

export interface MessageFil {
  id: string;
  tenantId: string;
  filId: string;
  ref: string;
  canal: CanalFil;
  sens: SensMessage;
  contenu: string;
  destinataire: string | null;
  expediteur: string | null;
  externalId: string | null;
  statut: string;
  envoyeAt: Date | null;
  createdAt: Date;
}

export interface FilsVoyageurRepository {
  creer(data: CreerFilData): Promise<FilVoyageur>;
  trouverParId(tenantId: string, id: string): Promise<FilVoyageur | null>;
  trouverParCle(
    tenantId: string,
    cleRegroupement: string,
  ): Promise<FilVoyageur | null>;
  trouverParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<FilVoyageur | null>;
  /** Regroupe par email ou téléphone, tous canaux confondus. */
  trouverParContact(
    tenantId: string,
    contact: { email?: string | null; telephone?: string | null },
  ): Promise<FilVoyageur | null>;
  listerParTenant(
    tenantId: string,
    filtre?: { statut?: StatutFil; logementId?: string; recherche?: string },
  ): Promise<FilVoyageur[]>;
  mettreAJour(
    tenantId: string,
    id: string,
    data: MettreAJourFilData,
  ): Promise<FilVoyageur | null>;
  supprimer(tenantId: string, id: string): Promise<boolean>;
  creerMessage(data: CreerMessageFilData): Promise<MessageFil>;
  trouverMessageParRef(
    tenantId: string,
    ref: string,
  ): Promise<MessageFil | null>;
  listerMessages(tenantId: string, filId: string): Promise<MessageFil[]>;
  marquerMessagesLus(tenantId: string, filId: string): Promise<number>;
  trouverMessageParExternalId(
    tenantId: string,
    canal: CanalFil,
    externalId: string,
  ): Promise<MessageFil | null>;
}
