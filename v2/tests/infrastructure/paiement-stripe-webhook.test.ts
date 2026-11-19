import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_SECRET_KEY: "sk_test_webhook",
    STRIPE_WEBHOOK_SECRET: "whsec_test_webhook",
  },
}));

const { creerPaiementStripe } = await import(
  "@/infrastructure/adapters/paiement-stripe"
);

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function signer(payload: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", "whsec_test_webhook")
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

async function lire(payload: unknown) {
  const corps = JSON.stringify(payload);
  return creerPaiementStripe().verifierEtLireWebhook(corps, signer(corps));
}

describe("webhook Stripe : identifiant d'événement (FR-024)", () => {
  it("propage evt_... sur un paiement réussi", async () => {
    const evenement = await lire({
      id: "evt_paiement_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_1",
          amount_total: 30_000,
          client_reference_id: "RES-1",
          metadata: { tenant_id: "t1", echeance_id: "e1" },
        },
      },
    });

    expect(evenement.type).toBe("paiement_reussi");
    expect(evenement.evenementId).toBe("evt_paiement_1");
    if (evenement.type !== "paiement_reussi") return;
    expect(evenement.sessionId).toBe("cs_test_1");
    expect(evenement.metadata.echeance_id).toBe("e1");
  });

  it("propage evt_... sur un litige", async () => {
    const evenement = await lire({
      id: "evt_litige_1",
      type: "charge.dispute.created",
      data: {
        object: {
          id: "dp_test_1",
          amount: 12_500,
          currency: "eur",
          reason: "fraudulent",
          status: "needs_response",
        },
      },
    });

    expect(evenement.type).toBe("litige");
    expect(evenement.evenementId).toBe("evt_litige_1");
    if (evenement.type !== "litige") return;
    expect(evenement.litige.id).toBe("dp_test_1");
  });

  it("propage evt_... sur un type non géré", async () => {
    const evenement = await lire({
      id: "evt_autre_1",
      type: "customer.created",
      data: { object: { id: "cus_1" } },
    });

    expect(evenement.type).toBe("autre");
    expect(evenement.evenementId).toBe("evt_autre_1");
  });

  it("tolère un payload sans identifiant (trace impossible, traitement best-effort)", async () => {
    const evenement = await lire({
      type: "customer.created",
      data: { object: { id: "cus_1" } },
    });

    expect(evenement.evenementId).toBe("");
  });

  it("refuse une signature invalide", async () => {
    await expect(
      creerPaiementStripe().verifierEtLireWebhook('{"id":"evt_1"}', "t=1,v1=dead"),
    ).rejects.toThrow("Signature Stripe invalide.");
  });
});
