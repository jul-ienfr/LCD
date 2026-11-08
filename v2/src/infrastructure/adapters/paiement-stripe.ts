import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  EmpreinteCarte,
  EvenementPaiement,
  IntentionEmpreinte,
  LitigeStripe,
  Paiement,
  PaiementIntention,
  PaiementSession,
  ResultatCapture,
  ResultatRemboursement,
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

interface ReponseLitige {
  id?: string;
  amount?: number;
  currency?: string;
  reason?: string;
  status?: string;
  payment_intent?: string | null;
  charge?: string | null;
  evidence_details?: { due_by?: number | null };
}

interface ReponseIntention {
  id?: string;
  client_secret?: string;
  status?: string;
  amount?: number;
  amount_received?: number;
  metadata?: Record<string, string>;
}

interface ReponseRemboursement {
  id?: string;
  amount?: number;
  status?: string;
}

interface EvenementStripe {
  type?: string;
  data?: { object?: ReponseSessionStripe & ReponseLitige };
}

export function identifiantLitigeValide(disputeId: string): boolean {
  return /^dp_[A-Za-z0-9]+$/.test(disputeId);
}

export function texteLitigeValide(texte: string): boolean {
  const propre = texte.trim();
  return propre.length >= 20 && propre.length <= 20_000;
}

/** Convertit l'objet Stripe `charge.dispute.*` en litige du port. */
export function composerLitigeStripe(
  objet: ReponseLitige,
  metadata: Record<string, string> = {},
): LitigeStripe {
  if (!objet.id || typeof objet.amount !== "number") {
    throw new Error("Litige Stripe incomplet.");
  }
  return {
    id: objet.id,
    montantCentimes: objet.amount,
    devise: (objet.currency ?? "eur").toUpperCase(),
    motif: objet.reason ?? "inconnu",
    statut: objet.status ?? "inconnu",
    paymentIntentId: objet.payment_intent ?? null,
    echeance: objet.evidence_details?.due_by
      ? new Date(objet.evidence_details.due_by * 1000).toISOString()
      : null,
    metadata,
  };
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
        // Copie sur le PaymentIntent : un litige ne porte pas les métadonnées
        // de la session Checkout, mais il référence le PaymentIntent.
        body.set(`payment_intent_data[metadata][${cle}]`, valeur);
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

    async creerEmpreinte(
      intention: IntentionEmpreinte,
    ): Promise<EmpreinteCarte> {
      if (
        !Number.isInteger(intention.montantCentimes) ||
        intention.montantCentimes <= 0
      ) {
        throw new Error("Stripe : montant d'empreinte invalide.");
      }
      const body = new URLSearchParams();
      body.set("amount", String(intention.montantCentimes));
      body.set("currency", "eur");
      body.set("capture_method", "manual");
      body.set("payment_method_types[0]", "card");
      if (intention.emailClient) {
        body.set("receipt_email", intention.emailClient);
      }
      for (const [cle, valeur] of Object.entries(intention.metadata ?? {})) {
        body.set(`metadata[${cle}]`, valeur);
      }

      const reponse = await fetch(`${API_STRIPE}/payment_intents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      if (!reponse.ok) {
        const detail = await reponse.text();
        throw new Error(
          `Stripe empreinte ${reponse.status} : ${detail.slice(0, 300)}`,
        );
      }

      const donnees = (await reponse.json()) as ReponseIntention;
      if (!donnees.id || !donnees.client_secret) {
        throw new Error("Stripe : empreinte incomplète.");
      }
      const statut: EmpreinteCarte["statut"] =
        donnees.status === "requires_capture"
          ? "requires_capture"
          : donnees.status === "requires_payment_method" ||
              donnees.status === "requires_confirmation" ||
              donnees.status === "requires_action"
            ? "requires_payment_method"
            : "echec";
      return {
        id: donnees.id,
        clientSecret: donnees.client_secret,
        statut,
      };
    },

    async capturerEmpreinte(
      empreinteId: string,
      montantCentimes?: number,
    ): Promise<ResultatCapture> {
      if (!/^pi_[A-Za-z0-9]+$/.test(empreinteId)) {
        throw new Error("Identifiant d'empreinte Stripe invalide.");
      }
      const body = new URLSearchParams();
      if (montantCentimes !== undefined) {
        if (!Number.isInteger(montantCentimes) || montantCentimes <= 0) {
          throw new Error("Stripe : montant de capture invalide.");
        }
        body.set("amount_to_capture", String(montantCentimes));
      }

      const reponse = await fetch(
        `${API_STRIPE}/payment_intents/${encodeURIComponent(empreinteId)}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        },
      );
      if (!reponse.ok) {
        const detail = await reponse.text();
        throw new Error(
          `Stripe capture ${reponse.status} : ${detail.slice(0, 300)}`,
        );
      }
      const donnees = (await reponse.json()) as ReponseIntention;
      return {
        id: donnees.id ?? empreinteId,
        montantCentimes:
          donnees.amount_received ?? montantCentimes ?? donnees.amount ?? 0,
        statut: donnees.status === "succeeded" ? "capture" : "echec",
      };
    },

    async annulerEmpreinte(empreinteId: string): Promise<{ statut: string }> {
      if (!/^pi_[A-Za-z0-9]+$/.test(empreinteId)) {
        throw new Error("Identifiant d'empreinte Stripe invalide.");
      }
      const reponse = await fetch(
        `${API_STRIPE}/payment_intents/${encodeURIComponent(empreinteId)}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );
      if (!reponse.ok) {
        const detail = await reponse.text();
        throw new Error(
          `Stripe annulation ${reponse.status} : ${detail.slice(0, 300)}`,
        );
      }
      const donnees = (await reponse.json()) as ReponseIntention;
      return { statut: donnees.status ?? "canceled" };
    },

    async rembourser(
      paiementId: string,
      montantCentimes?: number,
    ): Promise<ResultatRemboursement> {
      const reference = paiementId.trim();
      if (!reference) {
        throw new Error("Identifiant de paiement Stripe manquant.");
      }
      if (!/^pi_[A-Za-z0-9]+$/.test(reference)) {
        throw new Error(
          "Identifiant de paiement Stripe invalide : un PaymentIntent (pi_) est requis.",
        );
      }
      if (
        montantCentimes !== undefined &&
        (!Number.isInteger(montantCentimes) || montantCentimes <= 0)
      ) {
        throw new Error("Stripe : montant de remboursement invalide.");
      }
      const body = new URLSearchParams();
      body.set("payment_intent", reference);
      if (montantCentimes !== undefined) {
        body.set("amount", String(montantCentimes));
      }

      const reponse = await fetch(`${API_STRIPE}/refunds`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      if (!reponse.ok) {
        const detail = await reponse.text();
        throw new Error(
          `Stripe remboursement ${reponse.status} : ${detail.slice(0, 300)}`,
        );
      }
      const donnees = (await reponse.json()) as ReponseRemboursement;
      const statut: ResultatRemboursement["statut"] =
        donnees.status === "succeeded"
          ? "rembourse"
          : donnees.status === "pending"
            ? "en_attente"
            : "echec";
      return {
        id: donnees.id ?? "",
        montantCentimes: donnees.amount ?? montantCentimes ?? 0,
        statut,
      };
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
      if (evenement.type?.startsWith("charge.dispute.")) {
        if (!session?.id || typeof session.amount !== "number") {
          throw new Error("Litige Stripe incomplet.");
        }
        let metadata: Record<string, string> = {};
        if (session.payment_intent) {
          const intention = await fetch(
            `${API_STRIPE}/payment_intents/${encodeURIComponent(session.payment_intent)}`,
            { headers: { Authorization: `Bearer ${secretKey}` } },
          );
          if (intention.ok) {
            const donnees = (await intention.json()) as ReponseIntention;
            metadata = donnees.metadata ?? {};
          }
        }
        return {
          type: "litige",
          litige: composerLitigeStripe(session, metadata),
        };
      }
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

    async soumettrePreuvesLitige(disputeId, texte) {
      if (!identifiantLitigeValide(disputeId)) {
        throw new Error("Identifiant de litige Stripe invalide.");
      }
      const contenu = texte.trim();
      if (!texteLitigeValide(contenu)) {
        throw new Error("La réponse au litige doit contenir 20 à 20 000 caractères.");
      }

      const body = new URLSearchParams();
      body.set("evidence[uncategorized_text]", contenu.slice(0, 20_000));
      const reponse = await fetch(
        `${API_STRIPE}/disputes/${encodeURIComponent(disputeId)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        },
      );
      if (!reponse.ok) {
        const detail = await reponse.text();
        throw new Error(`Stripe litige ${reponse.status} : ${detail.slice(0, 300)}`);
      }

      const fermeture = await fetch(
        `${API_STRIPE}/disputes/${encodeURIComponent(disputeId)}/close`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${secretKey}` },
        },
      );
      if (!fermeture.ok) {
        const detail = await fermeture.text();
        throw new Error(
          `Stripe clôture ${fermeture.status} : ${detail.slice(0, 300)}`,
        );
      }
      const resultat = (await fermeture.json()) as ReponseLitige;
      return { statut: resultat.status ?? "closed" };
    },
  };
}
