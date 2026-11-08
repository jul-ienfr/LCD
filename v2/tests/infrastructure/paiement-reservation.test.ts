import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_SECRET_KEY: "sk_test_reservation",
    STRIPE_WEBHOOK_SECRET: "whsec_test",
  },
}));

const { creerPaiementStripe } = await import(
  "@/infrastructure/adapters/paiement-stripe"
);

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

function reponseJson(donnees: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => donnees,
    text: async () => JSON.stringify(donnees),
  } as unknown as Response;
}

describe("adapter Stripe — réservation directe", () => {
  beforeEach(() => fetchMock.mockReset());
  afterEach(() => fetchMock.mockReset());

  it("crée une session Checkout avec métadonnées dupliquées sur le PaymentIntent", async () => {
    fetchMock.mockResolvedValueOnce(
      reponseJson({
        id: "cs_test_1",
        url: "https://checkout.stripe.test/cs_test_1",
        status: "open",
      }),
    );

    const session = await creerPaiementStripe().creerSession({
      ref: "echeance-1",
      montantCentimes: 36_000,
      devise: "EUR",
      description: "Acompte de réservation",
      emailClient: "camille@example.test",
      successUrl: "https://lcd.test/reserver/DIR-1?paiement=ok",
      cancelUrl: "https://lcd.test/reserver/DIR-1?paiement=annule",
      metadata: { tenant_id: "t1", echeance_id: "echeance-1" },
    });

    expect(session).toEqual({
      id: "cs_test_1",
      url: "https://checkout.stripe.test/cs_test_1",
      statut: "ouverte",
    });

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/checkout/sessions");
    const corps = String(options.body);
    expect(corps).toContain("line_items%5B0%5D%5Bprice_data%5D%5Bunit_amount%5D=36000");
    expect(corps).toContain("customer_email=camille%40example.test");
    expect(corps).toContain("metadata%5Becheance_id%5D=echeance-1");
    expect(corps).toContain(
      "payment_intent_data%5Bmetadata%5D%5Becheance_id%5D=echeance-1",
    );
  });

  it("remonte l'erreur Stripe sur échec de session", async () => {
    fetchMock.mockResolvedValueOnce(
      reponseJson({ error: { message: "carte refusée" } }, false, 402),
    );
    await expect(
      creerPaiementStripe().creerSession({
        ref: "echeance-2",
        montantCentimes: 10_000,
        devise: "EUR",
        description: "Solde",
        successUrl: "https://lcd.test/ok",
        cancelUrl: "https://lcd.test/ko",
      }),
    ).rejects.toThrow("Stripe 402");
  });

  it("rembourse un PaymentIntent et remonte l'échec", async () => {
    fetchMock.mockResolvedValueOnce(
      reponseJson({ id: "re_1", amount: 36_000, status: "succeeded" }),
    );
    const resultat = await creerPaiementStripe().rembourser?.(
      "pi_test1",
      36_000,
    );
    expect(resultat).toEqual({
      id: "re_1",
      montantCentimes: 36_000,
      statut: "rembourse",
    });
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/refunds");
    expect(String(options.body)).toContain("payment_intent=pi_test1");

    fetchMock.mockResolvedValueOnce(reponseJson({}, false, 400));
    await expect(
      creerPaiementStripe().rembourser?.("pi_test2", 1_000),
    ).rejects.toThrow("Stripe remboursement 400");
  });

  it("refuse un identifiant d'empreinte invalide au remboursement", async () => {
    await expect(
      creerPaiementStripe().rembourser?.("cs_test_pas_un_pi", 1_000),
    ).rejects.toThrow("invalide");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
