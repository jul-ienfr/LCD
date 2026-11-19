import type {
  WhatsAppEnvoi,
  WhatsAppMessage,
  WhatsAppSender,
} from "@/application/ports/whatsapp";
import { ErreurMetier } from "@/domain/erreurs";
import { env } from "@/lib/env";
import { fetchAvecReessais } from "./http-retry";

interface ReponseWhatsApp {
  messages?: { id?: string }[];
  error?: { message?: string; code?: number };
}

export function whatsappConfigured(): boolean {
  return Boolean(
    env.WHATSAPP_ENABLED &&
      env.WHATSAPP_API_TOKEN &&
      env.WHATSAPP_PHONE_NUMBER_ID,
  );
}

/** Numéro international au format E.164, sans espaces ni séparateurs. */
export function normaliserNumeroWhatsApp(valeur: string): string {
  const propre = valeur.replace(/[\s().-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(propre)) {
    throw new ErreurMetier(
      "CANAL_INVALIDE",
      "Le numéro WhatsApp doit être au format international (+33612345678).",
    );
  }
  return propre;
}

/**
 * Adapter WhatsApp Business Cloud (Meta). Désactivé par défaut : le canal
 * `whatsapp` reste indisponible tant que le compte Meta et le numéro ne sont
 * pas configurés. Envoi texte uniquement, dans la fenêtre de service de 24 h.
 */
export function creerWhatsAppCloud(options?: {
  token?: string;
  phoneNumberId?: string;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
}): WhatsAppSender {
  const token = options?.token ?? env.WHATSAPP_API_TOKEN;
  const phoneNumberId =
    options?.phoneNumberId ?? env.WHATSAPP_PHONE_NUMBER_ID;
  const fetchImpl = options?.fetchImpl ?? fetch;
  const baseUrl =
    options?.baseUrl ??
    `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}`;
  const actif = options
    ? Boolean(token && phoneNumberId)
    : env.WHATSAPP_ENABLED && Boolean(token && phoneNumberId);
  if (!actif || !token || !phoneNumberId) {
    throw new Error(
      "WhatsApp désactivé : configurez WHATSAPP_ENABLED=true, WHATSAPP_API_TOKEN et WHATSAPP_PHONE_NUMBER_ID.",
    );
  }
  const url = `${baseUrl.replace(/\/+$/, "")}/${phoneNumberId}/messages`;

  return {
    async envoyer(message: WhatsAppMessage): Promise<WhatsAppEnvoi> {
      const to = normaliserNumeroWhatsApp(message.to);
      const texte = message.text.trim();
      if (!texte) {
        throw new ErreurMetier(
          "MESSAGE_INVALIDE",
          "Le message WhatsApp est vide.",
        );
      }
      // Politique de retry (FR-022) : 429/5xx sont des refus certains, donc
      // rejoués ; pas d'erreur réseau — Meta n'expose pas de clé
      // d'idempotence et un timeout pourrait cacher un message déjà envoyé.
      const reponse = await fetchAvecReessais(
        url,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "text",
            text: { preview_url: false, body: texte },
          }),
        },
        {
          timeoutMs: 15_000,
          rejouerErreurReseau: false,
          fetchImpl,
        },
      );
      let donnees: ReponseWhatsApp = {};
      try {
        donnees = (await reponse.json()) as ReponseWhatsApp;
      } catch {
        donnees = {};
      }
      if (!reponse.ok) {
        const motif = donnees.error?.message?.slice(0, 200);
        throw new ErreurMetier(
          "FOURNISSEUR_INDISPONIBLE",
          `WhatsApp a refusé le message (${reponse.status})${motif ? ` : ${motif}` : ""}.`,
        );
      }
      return { externalId: donnees.messages?.[0]?.id ?? null };
    },
  };
}
