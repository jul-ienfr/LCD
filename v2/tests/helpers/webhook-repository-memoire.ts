import type {
  CreerLivraisonData,
  EnregistrerWebhookData,
  MarquerLivraisonData,
  WebhookRepository,
  WebhookSender,
} from "@/application/ports/webhook-repository";
import type {
  TypeEvenementWebhook,
  Webhook,
  WebhookDelivery,
} from "@/domain/webhook";

export class WebhookRepositoryMemoire implements WebhookRepository {
  readonly webhooks: Webhook[] = [];
  readonly livraisons: WebhookDelivery[] = [];

  async enregistrer(data: EnregistrerWebhookData): Promise<Webhook> {
    const existant = this.webhooks.find(
      (webhook) =>
        webhook.tenantId === data.tenantId && webhook.url === data.url,
    );
    if (existant) {
      existant.libelle = data.libelle;
      existant.secret = data.secret;
      existant.events = data.events;
      existant.actif = true;
      existant.updatedAt = new Date();
      return existant;
    }

    const maintenant = new Date();
    const webhook: Webhook = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      libelle: data.libelle,
      url: data.url,
      secret: data.secret,
      events: data.events,
      actif: true,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.webhooks.push(webhook);
    return webhook;
  }

  async listerParTenant(tenantId: string): Promise<Webhook[]> {
    return this.webhooks.filter((webhook) => webhook.tenantId === tenantId);
  }

  async trouverParId(tenantId: string, id: string): Promise<Webhook | null> {
    return (
      this.webhooks.find(
        (webhook) => webhook.tenantId === tenantId && webhook.id === id,
      ) ?? null
    );
  }

  async supprimer(tenantId: string, id: string): Promise<void> {
    const index = this.webhooks.findIndex(
      (webhook) => webhook.tenantId === tenantId && webhook.id === id,
    );
    if (index >= 0) this.webhooks.splice(index, 1);
  }

  async listerActifsPourEvenement(
    tenantId: string,
    eventType: TypeEvenementWebhook,
  ): Promise<Webhook[]> {
    return this.webhooks.filter(
      (webhook) =>
        webhook.tenantId === tenantId &&
        webhook.actif &&
        webhook.events.includes(eventType),
    );
  }

  async creerLivraison(data: CreerLivraisonData): Promise<WebhookDelivery> {
    const maintenant = new Date();
    const livraison: WebhookDelivery = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      webhookId: data.webhookId,
      eventType: data.eventType,
      payload: data.payload,
      statut: "pending",
      tentatives: 0,
      prochaineTentative: maintenant,
      dernierCode: null,
      dernierMessage: null,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.livraisons.push(livraison);
    return livraison;
  }

  async listerLivraisonsDues(limit: number): Promise<WebhookDelivery[]> {
    return this.livraisons
      .filter(
        (livraison) =>
          livraison.statut === "pending" &&
          livraison.prochaineTentative.getTime() <= Date.now(),
      )
      .slice(0, limit);
  }

  async marquerLivraison(
    id: string,
    data: MarquerLivraisonData,
  ): Promise<void> {
    const livraison = this.livraisons.find((item) => item.id === id);
    if (!livraison) return;
    livraison.statut = data.statut;
    livraison.tentatives = data.tentatives;
    livraison.prochaineTentative = data.prochaineTentative;
    livraison.dernierCode = data.dernierCode;
    livraison.dernierMessage = data.dernierMessage;
    livraison.updatedAt = new Date();
  }

  async listerLivraisonsParTenant(
    tenantId: string,
    limit: number,
  ): Promise<WebhookDelivery[]> {
    return this.livraisons
      .filter((livraison) => livraison.tenantId === tenantId)
      .slice(-limit)
      .reverse();
  }

  rendreDue(id: string): void {
    const livraison = this.livraisons.find((item) => item.id === id);
    if (livraison) livraison.prochaineTentative = new Date(Date.now() - 1_000);
  }

  preparerTentatives(id: string, tentatives: number): void {
    const livraison = this.livraisons.find((item) => item.id === id);
    if (livraison) livraison.tentatives = tentatives;
  }
}

export class WebhookSenderMemoire implements WebhookSender {
  readonly envois: Parameters<WebhookSender["envoyer"]>[0][] = [];
  resultat = { ok: true, status: 200, message: "OK" };

  async envoyer(
    input: Parameters<WebhookSender["envoyer"]>[0],
  ): Promise<{ ok: boolean; status: number; message: string }> {
    this.envois.push(input);
    return this.resultat;
  }
}
