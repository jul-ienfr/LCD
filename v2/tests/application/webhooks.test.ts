import { describe, expect, it } from "vitest";
import { GererWebhook } from "@/application/use-cases/gerer-webhook";
import { LivrerWebhooks } from "@/application/use-cases/livrer-webhooks";
import { PlanifierWebhook } from "@/application/use-cases/planifier-webhook";
import {
  WebhookRepositoryMemoire,
  WebhookSenderMemoire,
} from "../helpers/webhook-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const autreTenant = "22222222-2222-4222-8222-222222222222";

async function contexte() {
  const repo = new WebhookRepositoryMemoire();
  const sender = new WebhookSenderMemoire();
  const gerer = new GererWebhook(repo);
  const webhook = await gerer.enregistrer({
    tenantId,
    libelle: "Home Assistant",
    url: "https://ha.example.com/api/webhook/lcd",
    secret: "0123456789abcdef",
    events: ["reservation.created", "paiement.created"],
  });
  return { repo, sender, gerer, webhook };
}

describe("webhooks", () => {
  it("refuse une URL non HTTPS", async () => {
    const repo = new WebhookRepositoryMemoire();
    await expect(
      new GererWebhook(repo).enregistrer({
        tenantId,
        libelle: "Local",
        url: "http://localhost:8123/hook",
        secret: "0123456789abcdef",
        events: ["reservation.created"],
      }),
    ).rejects.toMatchObject({ code: "WEBHOOK_INVALIDE" });
  });

  it("planifie uniquement pour les webhooks abonnés au tenant", async () => {
    const { repo, webhook } = await contexte();
    await new GererWebhook(repo).enregistrer({
      tenantId: autreTenant,
      libelle: "Autre",
      url: "https://autre.example.com/hook",
      secret: "0123456789abcdef",
      events: ["reservation.created"],
    });
    await new GererWebhook(repo).enregistrer({
      tenantId,
      libelle: "Paiements",
      url: "https://paiements.example.com/hook",
      secret: "0123456789abcdef",
      events: ["paiement.created"],
    });

    const resultat = await new PlanifierWebhook(repo).executer({
      tenantId,
      eventType: "reservation.created",
      data: { ref: "resa-1" },
    });

    expect(resultat.webhooks).toBe(1);
    expect(repo.livraisons).toHaveLength(1);
    expect(repo.livraisons[0]?.webhookId).toBe(webhook.id);
    expect(repo.livraisons[0]?.payload).toMatchObject({
      type: "reservation.created",
      data: { ref: "resa-1" },
    });
  });

  it("livre un webhook et marque le succès", async () => {
    const { repo, sender, webhook } = await contexte();
    await new PlanifierWebhook(repo).executer({
      tenantId,
      eventType: "reservation.created",
      data: { ref: "resa-1" },
    });
    const livraison = repo.livraisons[0];
    if (!livraison) throw new Error("Livraison absente.");

    const resultat = await new LivrerWebhooks(repo, sender).executer();
    expect(resultat.succes).toBe(1);
    expect(sender.envois[0]?.url).toBe(webhook.url);
    expect(repo.livraisons[0]?.statut).toBe("success");
    expect(repo.livraisons[0]?.tentatives).toBe(1);
  });

  it("programme un nouvel essai après échec", async () => {
    const { repo, sender } = await contexte();
    await new PlanifierWebhook(repo).executer({
      tenantId,
      eventType: "reservation.created",
      data: {},
    });
    sender.resultat = { ok: false, status: 500, message: "Erreur" };

    const resultat = await new LivrerWebhooks(repo, sender).executer();
    expect(resultat.reessais).toBe(1);
    expect(repo.livraisons[0]?.statut).toBe("pending");
    expect(repo.livraisons[0]?.tentatives).toBe(1);
    expect(repo.livraisons[0]?.dernierCode).toBe(500);
    expect(repo.livraisons[0]?.prochaineTentative.getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  it("abandonne après 5 tentatives", async () => {
    const { repo, sender } = await contexte();
    await new PlanifierWebhook(repo).executer({
      tenantId,
      eventType: "reservation.created",
      data: {},
    });
    const livraison = repo.livraisons[0];
    if (!livraison) throw new Error("Livraison absente.");
    repo.preparerTentatives(livraison.id, 4);
    sender.resultat = { ok: false, status: 500, message: "Erreur" };

    const resultat = await new LivrerWebhooks(repo, sender).executer();
    expect(resultat.echecs).toBe(1);
    expect(repo.livraisons[0]?.statut).toBe("failed");
    expect(repo.livraisons[0]?.tentatives).toBe(5);
  });
});
