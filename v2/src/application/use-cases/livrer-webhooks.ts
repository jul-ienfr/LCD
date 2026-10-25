import type {
  WebhookRepository,
  WebhookSender,
} from "../ports/webhook-repository";

const MAX_TENTATIVES = 5;
const DELAIS_MINUTES = [0, 1, 5, 15, 60];

export interface ResultatLivraisonWebhooks {
  traitees: number;
  succes: number;
  echecs: number;
  reessais: number;
}

export class LivrerWebhooks {
  constructor(
    private readonly repo: WebhookRepository,
    private readonly sender: WebhookSender,
  ) {}

  async executer(input: { limit?: number } = {}): Promise<ResultatLivraisonWebhooks> {
    const livraisons = await this.repo.listerLivraisonsDues(input.limit ?? 25);
    const resultat: ResultatLivraisonWebhooks = {
      traitees: livraisons.length,
      succes: 0,
      echecs: 0,
      reessais: 0,
    };

    for (const livraison of livraisons) {
      const webhook = await this.repo.trouverParId(
        livraison.tenantId,
        livraison.webhookId,
      );
      if (!webhook || !webhook.actif) {
        await this.repo.marquerLivraison(livraison.id, {
          statut: "failed",
          tentatives: livraison.tentatives + 1,
          prochaineTentative: new Date(),
          dernierCode: null,
          dernierMessage: "Webhook supprimé ou inactif.",
        });
        resultat.echecs += 1;
        continue;
      }

      const envoi = await this.sender.envoyer({
        url: webhook.url,
        secret: webhook.secret,
        eventType: livraison.eventType,
        payload: livraison.payload,
        deliveryId: livraison.id,
      });
      const tentatives = livraison.tentatives + 1;

      if (envoi.ok) {
        await this.repo.marquerLivraison(livraison.id, {
          statut: "success",
          tentatives,
          prochaineTentative: new Date(),
          dernierCode: envoi.status,
          dernierMessage: envoi.message,
        });
        resultat.succes += 1;
        continue;
      }

      if (tentatives >= MAX_TENTATIVES) {
        await this.repo.marquerLivraison(livraison.id, {
          statut: "failed",
          tentatives,
          prochaineTentative: new Date(),
          dernierCode: envoi.status,
          dernierMessage: envoi.message,
        });
        resultat.echecs += 1;
        continue;
      }

      const delai = DELAIS_MINUTES[Math.min(tentatives, DELAIS_MINUTES.length - 1)] ?? 60;
      await this.repo.marquerLivraison(livraison.id, {
        statut: "pending",
        tentatives,
        prochaineTentative: new Date(Date.now() + delai * 60_000),
        dernierCode: envoi.status,
        dernierMessage: envoi.message,
      });
      resultat.reessais += 1;
    }

    return resultat;
  }
}
