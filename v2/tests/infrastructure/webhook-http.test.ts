import { afterEach, describe, expect, it, vi } from "vitest";
import {
  creerWebhookHttp,
  signerWebhook,
} from "@/infrastructure/adapters/webhook-http";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("webhook HTTP", () => {
  it("signe le corps en HMAC-SHA256", () => {
    const signature = signerWebhook("secret", '{"a":1}');
    expect(signature).toMatch(/^[a-f0-9]{64}$/);
    expect(signerWebhook("secret", '{"a":1}')).toBe(signature);
    expect(signerWebhook("autre", '{"a":1}')).not.toBe(signature);
  });

  it("envoie les en-têtes signés", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("OK", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const resultat = await creerWebhookHttp().envoyer({
      url: "https://ha.example.com/hook",
      secret: "0123456789abcdef",
      eventType: "reservation.created",
      payload: { id: "evt-1" },
      deliveryId: "del-1",
    });

    expect(resultat.ok).toBe(true);
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers["X-LCD-Event"]).toBe("reservation.created");
    expect(headers["X-LCD-Delivery"]).toBe("del-1");
    expect(headers["X-LCD-Signature"]).toMatch(/^sha256=[a-f0-9]{64}$/);
  });

  it("retourne un échec propre si le réseau tombe", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("réseau")));
    const resultat = await creerWebhookHttp().envoyer({
      url: "https://ha.example.com/hook",
      secret: "0123456789abcdef",
      eventType: "ticket.created",
      payload: {},
      deliveryId: "del-2",
    });
    expect(resultat.ok).toBe(false);
    expect(resultat.status).toBe(0);
    expect(resultat.message).toContain("réseau");
  });
});
