import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_SECRET_KEY: "sk_test_lcd",
    STRIPE_WEBHOOK_SECRET: "whsec_lcd",
  },
}));

import { creerPaiementStripe } from "@/infrastructure/adapters/paiement-stripe";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function reponseJson(donnees: unknown): Response {
  return new Response(JSON.stringify(donnees), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("Stripe : empreinte, capture, remboursement", () => {
  it("crée une empreinte à capture manuelle", async () => {
    fetchMock.mockResolvedValue(
      reponseJson({
        id: "pi_123",
        client_secret: "pi_123_secret",
        status: "requires_payment_method",
      }),
    );

    const empreinte = await creerPaiementStripe().creerEmpreinte?.({
      ref: "CAU-1",
      montantCentimes: 50_000,
      devise: "EUR",
      metadata: { reservation_id: "r1" },
    });

    expect(empreinte).toEqual({
      id: "pi_123",
      clientSecret: "pi_123_secret",
      statut: "requires_payment_method",
    });
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/payment_intents");
    const corps = options.body as URLSearchParams;
    expect(corps.get("amount")).toBe("50000");
    expect(corps.get("capture_method")).toBe("manual");
    expect(corps.get("metadata[reservation_id]")).toBe("r1");
  });

  it("capture une empreinte avec un montant partiel", async () => {
    fetchMock.mockResolvedValue(
      reponseJson({
        id: "pi_123",
        status: "succeeded",
        amount_received: 12_000,
      }),
    );

    const capture = await creerPaiementStripe().capturerEmpreinte?.(
      "pi_123",
      12_000,
    );

    expect(capture).toEqual({
      id: "pi_123",
      montantCentimes: 12_000,
      statut: "capture",
    });
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/payment_intents/pi_123/capture");
    expect((options.body as URLSearchParams).get("amount_to_capture")).toBe(
      "12000",
    );
  });

  it("rembourse un paiement", async () => {
    fetchMock.mockResolvedValue(
      reponseJson({ id: "re_123", amount: 7_500, status: "succeeded" }),
    );

    const remboursement = await creerPaiementStripe().rembourser?.(
      "pi_123",
      7_500,
    );

    expect(remboursement).toEqual({
      id: "re_123",
      montantCentimes: 7_500,
      statut: "rembourse",
    });
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((options.body as URLSearchParams).get("payment_intent")).toBe(
      "pi_123",
    );
    expect((options.body as URLSearchParams).get("amount")).toBe("7500");
  });

  it("refuse un identifiant de capture invalide", async () => {
    await expect(
      creerPaiementStripe().capturerEmpreinte?.("charge_123"),
    ).rejects.toThrow("invalide");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("remonte le détail d'une erreur Stripe", async () => {
    fetchMock.mockResolvedValue(
      new Response("card_declined", { status: 402 }),
    );
    await expect(
      creerPaiementStripe().rembourser?.("pi_123", 1_000),
    ).rejects.toThrow("Stripe remboursement 402");
  });
});
