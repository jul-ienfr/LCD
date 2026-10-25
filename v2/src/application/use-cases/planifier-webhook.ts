import { randomUUID } from "node:crypto";
import { ErreurMetier } from "@/domain/erreurs";
import {
  evenementWebhookValide,
  type TypeEvenementWebhook,
} from "@/domain/webhook";
import type { WebhookRepository } from "../ports/webhook-repository";

export interface PlanifierWebhookInput {
  tenantId: string;
  eventType: string;
  data: Record<string, unknown>;
}

export class PlanifierWebhook {
  constructor(private readonly repo: WebhookRepository) {}

  async executer(input: PlanifierWebhookInput) {
    if (!evenementWebhookValide(input.eventType)) {
      throw new ErreurMetier(
        "WEBHOOK_INVALIDE",
        "Type d'événement webhook inconnu.",
      );
    }

    const webhooks = await this.repo.listerActifsPourEvenement(
      input.tenantId,
      input.eventType as TypeEvenementWebhook,
    );
    const payload = {
      id: randomUUID(),
      type: input.eventType,
      occurredAt: new Date().toISOString(),
      data: input.data,
    };

    for (const webhook of webhooks) {
      await this.repo.creerLivraison({
        tenantId: input.tenantId,
        webhookId: webhook.id,
        eventType: input.eventType as TypeEvenementWebhook,
        payload,
      });
    }

    return { webhooks: webhooks.length };
  }
}
