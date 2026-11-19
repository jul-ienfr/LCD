import type { SmsSender } from "@/application/ports/sms";
import { env } from "@/lib/env";
import { fetchAvecReessais } from "./http-retry";

const URL_BREVO_SMS = "https://api.brevo.com/v3/transactionalSMS/sms";

export function smsConfigured(): boolean {
  return env.SMS_ENABLED && Boolean(env.BREVO_API_KEY);
}

/**
 * Adapter Brevo SMS. Le fournisseur reste confiné ici ; l'app ne connaît que
 * le port SmsSender. Désactivé par défaut (SMS_ENABLED=false).
 */
export function creerSmsBrevo(): SmsSender {
  const cle = env.BREVO_API_KEY;
  if (!env.SMS_ENABLED || !cle) {
    throw new Error(
      "SMS désactivé : configurez SMS_ENABLED=true et BREVO_API_KEY.",
    );
  }

  return {
    async envoyer(message): Promise<void> {
      // Politique de retry (FR-022) : 429/5xx sont des refus certains, donc
      // rejoués. Pas d'erreur réseau : l'API Brevo n'a pas de clé
      // d'idempotence, un timeout pourrait cacher un SMS déjà parti.
      const reponse = await fetchAvecReessais(
        URL_BREVO_SMS,
        {
          method: "POST",
          headers: {
            "api-key": cle,
            "content-type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({
            sender: env.BREVO_SMS_SENDER,
            recipient: message.to,
            content: message.text,
            type: "transactional",
          }),
        },
        { timeoutMs: 10_000, rejouerErreurReseau: false },
      );
      if (!reponse.ok) {
        const detail = await reponse.text().catch(() => "");
        throw new Error(
          `Brevo SMS ${reponse.status}${detail ? ` : ${detail.slice(0, 200)}` : ""}`,
        );
      }
    },
  };
}
