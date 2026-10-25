import { ErreurMetier } from "@/domain/erreurs";
import {
  evenementWebhookValide,
  libelleWebhookValide,
  secretWebhookValide,
  urlWebhookValide,
  type TypeEvenementWebhook,
  type Webhook,
} from "@/domain/webhook";
import type { WebhookRepository } from "../ports/webhook-repository";

export interface EnregistrerWebhookInput {
  tenantId: string;
  libelle: string;
  url: string;
  secret: string;
  events: string[];
}

export class GererWebhook {
  constructor(private readonly repo: WebhookRepository) {}

  async enregistrer(input: EnregistrerWebhookInput): Promise<Webhook> {
    const libelle = input.libelle.trim();
    const url = input.url.trim();
    const secret = input.secret.trim();
    const events = [...new Set(input.events)].filter(evenementWebhookValide);

    if (!libelleWebhookValide(libelle)) {
      throw new ErreurMetier(
        "WEBHOOK_INVALIDE",
        "Le libellé doit faire 2 à 60 caractères.",
      );
    }
    if (!urlWebhookValide(url)) {
      throw new ErreurMetier(
        "WEBHOOK_INVALIDE",
        "URL webhook invalide : HTTPS public requis (pas de localhost/IP privée).",
      );
    }
    if (!secretWebhookValide(secret)) {
      throw new ErreurMetier(
        "WEBHOOK_INVALIDE",
        "Le secret doit faire au moins 16 caractères.",
      );
    }
    if (events.length === 0) {
      throw new ErreurMetier(
        "WEBHOOK_INVALIDE",
        "Sélectionnez au moins un événement.",
      );
    }

    return this.repo.enregistrer({
      tenantId: input.tenantId,
      libelle,
      url,
      secret,
      events: events as TypeEvenementWebhook[],
    });
  }

  async supprimer(tenantId: string, id: string): Promise<void> {
    await this.repo.supprimer(tenantId, id);
  }
}
