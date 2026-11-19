import { createHmac } from "node:crypto";
import type {
  ResultatEnvoiWebhook,
  WebhookSender,
} from "@/application/ports/webhook-repository";
import { fetchAvecReessais } from "./http-retry";

export function signerWebhook(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function creerWebhookHttp(): WebhookSender {
  return {
    async envoyer(input): Promise<ResultatEnvoiWebhook> {
      const body = JSON.stringify({
        deliveryId: input.deliveryId,
        eventType: input.eventType,
        payload: input.payload,
      });
      const signature = signerWebhook(input.secret, body);

      try {
        // Politique de retry (FR-022) : 429/5xx sont rejoués ici (quelques
        // secondes) ; l'échec réseau est remonté tel quel pour que la
        // livraison reparte selon le calendrier de réessai du cycle (mêmes
        // en-têtes signés, donc idempotent par X-LCD-Delivery).
        const reponse = await fetchAvecReessais(
          input.url,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-LCD-Event": input.eventType,
              "X-LCD-Delivery": input.deliveryId,
              "X-LCD-Signature": `sha256=${signature}`,
            },
            body,
            redirect: "error",
          },
          { timeoutMs: 5_000, rejouerErreurReseau: false },
        );
        const texte = (await reponse.text()).slice(0, 300);
        return {
          ok: reponse.ok,
          status: reponse.status,
          message: texte || (reponse.ok ? "OK" : "Erreur HTTP"),
        };
      } catch (error) {
        return {
          ok: false,
          status: 0,
          message:
            error instanceof Error ? error.message.slice(0, 300) : String(error),
        };
      }
    },
  };
}
