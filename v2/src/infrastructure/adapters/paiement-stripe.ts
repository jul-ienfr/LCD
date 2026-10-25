import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  EvenementPaiement,
  Paiement,
  PaiementIntention,
  PaiementSession,
} from "@/application/ports/paiement";
import { env } from "@/lib/env";

const API_STRIPE = "https://api.stripe.com/v1";

interface ReponseSessionStripe {
  id?: string;
  url?: string;
  status?: string;
  amount_total?: number;
  currency?: string;
  client_reference_id?: string;
  metadata?: Record<string, string>;
}

interface EvenementStripe {
  type?: string;
  data?: { object?: ReponseSessionStripe };
}

function sessionDepuisReponse(data: ReponseSessionStripe): PaiementSession {
  if (!data.id || !data.url) {
    throw new Error("Stripe : session Checkout incomplète.");
  }
  const statut =
    data.status === "complete"
      ? "payee"
      : data.status === "expired"
        ? "expiree"
        : "ouverte";
  return { id: data.id, url: data.url, statut };
}

/** Vérifie la signature Stripe (`t=...,v1=...`) avec tolérance de 5 min. */
export function verifierSignatureStripe(
  payload: string,
  signature: string,
  secret: string,
  toleranceSecondes = 300,
  maintenant = Date.now(),
): boolean {
  const parties = signature.split(",").reduce<Record<string, string[]>>(
    (acc, partie) => {
      const [cle, valeur] = partie.split("=");
      if (!cle || !valeur) return acc;
      acc[cle] = [...(acc[cle] ?? []), valeur];
      return acc;
    },
    {},
  );

  const timestamp = parties.t?.[0];
  const signatures = parties.v1 ?? [];
  if (!timestamp || signatures.length === 0) return false;

  const age = Math.abs(Math.floor(maintenant / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSecondes) return false;

  const attendu = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  const attenduBuffer = Buffer.from(attendu);
  return signatures.some((signatureRecue) => {
    const recuBuffer = Buffer.from(signatureRecue);
    return (
      recuBuffer.length === attenduBuffer.length &&
      timingSafeEqual(recuBuffer, attenduBuffer)
    );
  });
}

export function creerPaiementStripe(): Paiement {
  const secretKey = env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "Stripe non configuré : renseignez STRIPE_SECRET_KEY et STRIPE_WEBHOOK_SECRET.",
    );
  }

  return {
    async creerSession(intention: PaiementIntention): Promise<PaiementSession> {
      const body = new URLSearchParams();
      body.set("mode", "payment");
      body.set("success_url", intention.successUrl);
      body.set("cancel_url", intention.cancelUrl);
      body.set("client_reference_id", intention.ref);
      body.set("line_items[0][quantity]", "1");
      body.set("line_items[0][price_data][currency]", "eur");
      body.set(
        "line_items[0][price_data][unit_amount]",
        String(intention.montantCentimes),
      );
      body.set(
        "line_items[0][price_data][product_data][name]",
        intention.description,
      );
      if (intention.emailClient) {
        body.set("customer_email", intention.emailClient);
      }
      for (const [cle, valeur] of Object.entries(intention.metadata ?? {})) {
        body.set(`metadata[${cle}]`, valeur);
      }

      const reponse = await fetch(`${API_STRIPE}/checkout/sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });

      if (!reponse.ok) {
        const detail = await reponse.text();
        throw new Error(`Stripe ${reponse.status} : ${detail.slice(0, 300)}`);
      }

      return sessionDepuisReponse(
        (await reponse.json()) as ReponseSessionStripe,
      );
    },

    async verifierEtLireWebhook(
      payload: string,
      signature: string,
    ): Promise<EvenementPaiement> {
      const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error("STRIPE_WEBHOOK_SECRET absent.");
      }
      if (!verifierSignatureStripe(payload, signature, webhookSecret)) {
        throw new Error("Signature Stripe invalide.");
      }

      const evenement = JSON.parse(payload) as EvenementStripe;
      const session = evenement.data?.object;
      if (
        evenement.type !== "checkout.session.completed" &&
        evenement.type !== "checkout.session.async_payment_succeeded"
      ) {
        return {
          type: "autre",
          sessionId: session?.id ?? "",
          montantCentimes: 0,
          devise: "EUR",
          reference: "",
          metadata: {},
        };
      }
      if (!session?.id || typeof session.amount_total !== "number") {
        throw new Error("Événement Stripe sans session ou montant.");
      }

      return {
        type: "paiement_reussi",
        sessionId: session.id,
        montantCentimes: session.amount_total,
        devise: "EUR",
        reference: session.client_reference_id ?? "",
        metadata: session.metadata ?? {},
      };
    },
  };
}
