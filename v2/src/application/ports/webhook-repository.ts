import type {
  TypeEvenementWebhook,
  Webhook,
  WebhookDelivery,
} from "@/domain/webhook";

export interface EnregistrerWebhookData {
  tenantId: string;
  libelle: string;
  url: string;
  secret: string;
  events: TypeEvenementWebhook[];
}

export interface CreerLivraisonData {
  tenantId: string;
  webhookId: string;
  eventType: TypeEvenementWebhook;
  payload: Record<string, unknown>;
}

export interface MarquerLivraisonData {
  statut: WebhookDelivery["statut"];
  tentatives: number;
  prochaineTentative: Date;
  dernierCode: number | null;
  dernierMessage: string | null;
}

export interface WebhookRepository {
  enregistrer(data: EnregistrerWebhookData): Promise<Webhook>;
  listerParTenant(tenantId: string): Promise<Webhook[]>;
  trouverParId(tenantId: string, id: string): Promise<Webhook | null>;
  supprimer(tenantId: string, id: string): Promise<void>;
  listerActifsPourEvenement(
    tenantId: string,
    eventType: TypeEvenementWebhook,
  ): Promise<Webhook[]>;
  creerLivraison(data: CreerLivraisonData): Promise<WebhookDelivery>;
  listerLivraisonsDues(limit: number): Promise<WebhookDelivery[]>;
  marquerLivraison(id: string, data: MarquerLivraisonData): Promise<void>;
  listerLivraisonsParTenant(
    tenantId: string,
    limit: number,
  ): Promise<WebhookDelivery[]>;
}

export interface ResultatEnvoiWebhook {
  ok: boolean;
  status: number;
  message: string;
}

export interface WebhookSender {
  envoyer(input: {
    url: string;
    secret: string;
    eventType: TypeEvenementWebhook;
    payload: Record<string, unknown>;
    deliveryId: string;
  }): Promise<ResultatEnvoiWebhook>;
}
