import { describe, expect, it } from "vitest";
import {
  composerLitigeStripe,
  identifiantLitigeValide,
  texteLitigeValide,
} from "@/infrastructure/adapters/paiement-stripe";

describe("litige Stripe", () => {
  it("convertit un objet dispute en litige du port", () => {
    const litige = composerLitigeStripe(
      {
        id: "dp_123abc",
        amount: 12_500,
        currency: "eur",
        reason: "fraudulent",
        status: "needs_response",
        payment_intent: "pi_123",
        evidence_details: { due_by: 1_800_000_000 },
      },
      { tenant_id: "t1", facture_id: "f1" },
    );

    expect(litige).toMatchObject({
      id: "dp_123abc",
      montantCentimes: 12_500,
      devise: "EUR",
      motif: "fraudulent",
      statut: "needs_response",
      paymentIntentId: "pi_123",
      metadata: { tenant_id: "t1", facture_id: "f1" },
    });
    expect(litige.echeance).toBe(
      new Date(1_800_000_000 * 1000).toISOString(),
    );
  });

  it("refuse un litige sans identifiant ou montant", () => {
    expect(() => composerLitigeStripe({ amount: 1_000 })).toThrow(
      "Litige Stripe incomplet.",
    );
    expect(() => composerLitigeStripe({ id: "dp_1" })).toThrow(
      "Litige Stripe incomplet.",
    );
  });

  it("valide l’identifiant et le texte de réponse", () => {
    expect(identifiantLitigeValide("dp_abc123")).toBe(true);
    expect(identifiantLitigeValide("ch_abc123")).toBe(false);
    expect(identifiantLitigeValide("dp_")).toBe(false);

    expect(texteLitigeValide("x".repeat(20))).toBe(true);
    expect(texteLitigeValide("trop court")).toBe(false);
    expect(texteLitigeValide("x".repeat(20_001))).toBe(false);
  });
});
