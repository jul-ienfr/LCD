import type { SmsSender } from "@/application/ports/sms";
import { env } from "@/lib/env";

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
      const reponse = await fetch(URL_BREVO_SMS, {
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
        signal: AbortSignal.timeout(10_000),
      });
      if (!reponse.ok) {
        const detail = await reponse.text().catch(() => "");
        throw new Error(
          `Brevo SMS ${reponse.status}${detail ? ` : ${detail.slice(0, 200)}` : ""}`,
        );
      }
    },
  };
}
