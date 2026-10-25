import { afterEach, describe, expect, it, vi } from "vitest";
import {
  construireEvenementSentry,
  envoyerEvenementSentry,
  parserDsnSentry,
} from "@/lib/telemetry";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("télémétrie Sentry", () => {
  it("parse une DSN", () => {
    const cible = parserDsnSentry(
      "https://abc123@o42.ingest.sentry.io/456789",
    );
    expect(cible).toEqual({
      endpoint: "https://o42.ingest.sentry.io/api/456789/store/",
      clePublique: "abc123",
      projet: "456789",
    });
    expect(parserDsnSentry("pas une dsn")).toBeNull();
    expect(parserDsnSentry("https://@host/1")).toBeNull();
  });

  it("construit un événement et masque les secrets", () => {
    const erreur = new Error("boom");
    erreur.name = "TypeError";
    const evenement = construireEvenementSentry("test", erreur, {
      password: "secret",
      token: "abc",
      utilisateur: "julie",
      imbrique: { apiKey: "xyz" },
    });

    expect(evenement.message).toBe("test");
    expect(evenement.exception).toMatchObject({
      values: [{ type: "TypeError", value: "boom" }],
    });
    expect(evenement.extra).toMatchObject({
      password: "[masqué]",
      token: "[masqué]",
      utilisateur: "julie",
      imbrique: { apiKey: "[masqué]" },
    });
  });

  it("envoie l'événement à l'endpoint Sentry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await envoyerEvenementSentry(
      "https://abc123@o42.ingest.sentry.io/456789",
      { event_id: "1", message: "test" },
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://o42.ingest.sentry.io/api/456789/store/");
    expect(String(options.headers && (options.headers as Record<string, string>)["X-Sentry-Auth"])).toContain(
      "sentry_key=abc123",
    );
  });

  it("ne lève pas si Sentry est indisponible", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("réseau")));
    await expect(
      envoyerEvenementSentry(
        "https://abc123@o42.ingest.sentry.io/456789",
        { event_id: "1" },
      ),
    ).resolves.toBeUndefined();
  });
});
