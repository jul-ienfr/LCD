import type { Centimes } from "@/domain/pricing";

export interface PaiementIntention {
  ref: string;
  montantCentimes: Centimes;
  devise: "EUR";
  description: string;
  emailClient?: string;
}

export interface PaiementSession {
  id: string;
  url: string;
  statut: "ouverte" | "payee" | "annulee" | "expiree";
}

/**
 * Port de paiement. Implémentation par défaut : Stripe.
 * Le domaine ne connaît ni Stripe ni ses objets.
 */
export interface Paiement {
  creerSession(intention: PaiementIntention): Promise<PaiementSession>;
  verifierWebhook(payload: Uint8Array, signature: string): Promise<void>;
}
