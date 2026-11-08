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

export interface EvenementPaiementReussi {
  type: "paiement_reussi";
  sessionId: string;
  montantCentimes: Centimes;
  devise: "EUR";
  reference: string;
  metadata: Record<string, string>;
}

export interface LitigeStripe {
  id: string;
  montantCentimes: Centimes;
  devise: string;
  motif: string;
  statut: string;
  paymentIntentId: string | null;
  echeance: string | null;
  metadata: Record<string, string>;
}

export interface EvenementLitige {
  type: "litige";
  litige: LitigeStripe;
}

export interface EvenementPaiementAutre {
  type: "autre";
  sessionId: string;
  montantCentimes: Centimes;
  devise: "EUR";
  reference: string;
  metadata: Record<string, string>;
}

export type EvenementPaiement =
  | EvenementPaiementReussi
  | EvenementLitige
  | EvenementPaiementAutre;

export interface ResultatCapture {
  id: string;
  montantCentimes: Centimes;
  statut: "capture" | "echec";
}

export interface ResultatRemboursement {
  id: string;
  montantCentimes: Centimes;
  statut: "rembourse" | "en_attente" | "echec";
}

export interface IntentionEmpreinte {
  ref: string;
  montantCentimes: Centimes;
  devise: "EUR";
  emailClient?: string;
  metadata?: Record<string, string>;
}

export interface EmpreinteCarte {
  id: string;
  clientSecret: string;
  statut: "requires_capture" | "requires_payment_method" | "echec";
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
  soumettrePreuvesLitige(
    disputeId: string,
    texte: string,
  ): Promise<{ statut: string }>;
  /** Empreinte bancaire : autorisation sans débit, capturable plus tard. */
  creerEmpreinte?(intention: IntentionEmpreinte): Promise<EmpreinteCarte>;
  capturerEmpreinte?(
    empreinteId: string,
    montantCentimes?: Centimes,
  ): Promise<ResultatCapture>;
  annulerEmpreinte?(empreinteId: string): Promise<{ statut: string }>;
  rembourser?(
    paiementId: string,
    montantCentimes?: Centimes,
  ): Promise<ResultatRemboursement>;
}
