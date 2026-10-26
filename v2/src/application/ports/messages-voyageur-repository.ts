import type {
  CanalMessage,
  MessageVoyageur,
  TypeMessageVoyageur,
} from "@/domain/message-voyageur";

export interface CreerMessageData {
  tenantId: string;
  logementId: string;
  reservationId: string | null;
  ref: string;
  canal: CanalMessage;
  destinataire?: string | null;
  type: TypeMessageVoyageur;
  contenu: string;
}

export interface MessagesVoyageurRepository {
  creer(data: CreerMessageData): Promise<MessageVoyageur>;
  trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<MessageVoyageur | null>;
  trouverParId(
    tenantId: string,
    id: string,
  ): Promise<MessageVoyageur | null>;
  listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<MessageVoyageur[]>;
  marquerEnvoye(tenantId: string, id: string): Promise<MessageVoyageur>;
}
