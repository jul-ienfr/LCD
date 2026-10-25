import type { Centimes } from "@/domain/pricing";

export interface PaiementIntention {
  ref: string;
  montantCentimes: Centimes;
  devise: "EUR";
  description: string;
  emailClient?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface PaiementSession {
  id: string;
  url: string;
  statut: "ouverte" | "payee" | "annulee" | "expiree";
}

export interface EvenementPaiement {
  type: "paiement_reussi" | "autre";
  sessionId: string;
  montantCentimes: Centimes;
  devise: "EUR";
  reference: string;
  metadata: Record<string, string>;
}

/**
 * Port de paiement. Implémentation par défaut : Stripe Checkout + webhook.
 * Le domaine ne connaît ni Stripe ni ses objets.
 */
export interface Paiement {
  creerSession(intention: PaiementIntention): Promise<PaiementSession>;
  verifierEtLireWebhook(
    payload: string,
    signature: string,
  ): Promise<EvenementPaiement>;
}
