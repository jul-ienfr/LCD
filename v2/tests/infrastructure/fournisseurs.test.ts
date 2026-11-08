import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn<typeof fetch>();

function reponseJson(donnees: unknown, statut = 200): Response {
  return new Response(JSON.stringify(donnees), {
    status: statut,
    headers: { "content-type": "application/json" },
  });
}

function entetes(init: RequestInit | undefined): Headers {
  return new Headers(init?.headers);
}

beforeEach(() => {
  vi.resetModules();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Beds24Fournisseur", () => {
  beforeEach(() => {
    vi.stubEnv("BEDS24_API_TOKEN", "beds24-token");
    vi.stubEnv("BEDS24_API_BASE", "https://beds24.test/v2");
    vi.stubEnv("BEDS24_WEBHOOK_SECRET", "beds24-webhook");
  });

  it("teste la connexion avec le header token", async () => {
    fetchMock.mockResolvedValue(
      reponseJson({ validToken: true, token: { ownerId: 42 } }),
    );
    const { Beds24Fournisseur } = await import(
      "@/infrastructure/adapters/fournisseurs/beds24"
    );
    const resultat = await new Beds24Fournisseur().testerConnexion();
    expect(resultat.ok).toBe(true);
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(entetes(init).get("token")).toBe("beds24-token");
  });

  it("pousse une indisponibilité via le calendrier", async () => {
    fetchMock.mockResolvedValue(reponseJson([{ success: true }], 201));
    const { Beds24Fournisseur } = await import(
      "@/infrastructure/adapters/fournisseurs/beds24"
    );
    await new Beds24Fournisseur().pousserDisponibilites([
      {
        externalPropertyId: "10",
        externalRoomTypeId: "20",
        date: "2026-11-01",
        disponible: false,
      },
    ]);
    const [, init] = fetchMock.mock.calls[0] ?? [];
    const corps = JSON.parse(String(init?.body)) as {
      roomId: number;
      calendar: { numAvail: number }[];
    }[];
    expect(corps[0]?.roomId).toBe(20);
    expect(corps[0]?.calendar[0]?.numAvail).toBe(0);
  });

  it("pousse le stop-sell via numAvail 0", async () => {
    fetchMock.mockResolvedValue(reponseJson([{ success: true }], 201));
    const { Beds24Fournisseur } = await import(
      "@/infrastructure/adapters/fournisseurs/beds24"
    );
    await new Beds24Fournisseur().pousserRestrictions([
      {
        externalPropertyId: "10",
        externalRoomTypeId: "20",
        date: "2026-11-02",
        stopSell: true,
      },
    ]);
    const [, init] = fetchMock.mock.calls[0] ?? [];
    const corps = JSON.parse(String(init?.body)) as {
      roomId: number;
      calendar: { numAvail: number }[];
    }[];
    expect(corps[0]?.roomId).toBe(20);
    expect(corps[0]?.calendar[0]?.numAvail).toBe(0);
  });

  it("vérifie le secret partagé du webhook", async () => {
    const { Beds24Fournisseur } = await import(
      "@/infrastructure/adapters/fournisseurs/beds24"
    );
    const fournisseur = new Beds24Fournisseur();
    expect(
      await fournisseur.verifierWebhook({
        headers: new Headers({ "x-lcd-webhook-secret": "beds24-webhook" }),
        corps: "{}",
      }),
    ).toBe(true);
    expect(
      await fournisseur.verifierWebhook({
        headers: new Headers({ "x-lcd-webhook-secret": "faux" }),
        corps: "{}",
      }),
    ).toBe(false);
  });
});

describe("ChannexFournisseur", () => {
  beforeEach(() => {
    vi.stubEnv("CHANNEX_API_KEY", "channex-key");
    vi.stubEnv("CHANNEX_API_BASE", "https://channex.test/api/v1");
    vi.stubEnv("CHANNEX_WEBHOOK_SECRET", "channex-secret");
  });

  it("teste la connexion avec user-api-key", async () => {
    fetchMock.mockResolvedValue(
      reponseJson({ data: [], meta: { total: 2 } }),
    );
    const { ChannexFournisseur } = await import(
      "@/infrastructure/adapters/fournisseurs/channex"
    );
    const resultat = await new ChannexFournisseur().testerConnexion();
    expect(resultat.ok).toBe(true);
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(entetes(init).get("user-api-key")).toBe("channex-key");
  });

  it("pousse un tarif en unités mineures", async () => {
    fetchMock.mockResolvedValue(reponseJson({ data: [] }));
    const { ChannexFournisseur } = await import(
      "@/infrastructure/adapters/fournisseurs/channex"
    );
    await new ChannexFournisseur().pousserTarifs([
      {
        externalPropertyId: "property-1",
        externalRatePlanId: "rate-1",
        date: "2026-11-01",
        prixCentimes: 12050,
        devise: "EUR",
      },
    ]);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain("/rates");
    const corps = JSON.parse(String(init?.body)) as {
      values: { rate: number; rate_plan_id: string }[];
    };
    expect(corps.values[0]?.rate).toBe(12050);
    expect(corps.values[0]?.rate_plan_id).toBe("rate-1");
  });

  it("pousse les restrictions sur le bon endpoint", async () => {
    fetchMock.mockResolvedValue(reponseJson({ data: [] }));
    const { ChannexFournisseur } = await import(
      "@/infrastructure/adapters/fournisseurs/channex"
    );
    await new ChannexFournisseur().pousserRestrictions([
      {
        externalPropertyId: "property-1",
        externalRatePlanId: "rate-1",
        date: "2026-11-01",
        sejourMin: 3,
        arriveeAutorisee: false,
        stopSell: true,
      },
    ]);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain("/restrictions");
    const corps = JSON.parse(String(init?.body)) as {
      values: {
        min_stay_arrival: number;
        closed_to_arrival: boolean;
        stop_sell: boolean;
      }[];
    };
    expect(corps.values[0]?.min_stay_arrival).toBe(3);
    expect(corps.values[0]?.closed_to_arrival).toBe(true);
    expect(corps.values[0]?.stop_sell).toBe(true);
  });

  it("vérifie la signature HMAC du webhook", async () => {
    const { ChannexFournisseur } = await import(
      "@/infrastructure/adapters/fournisseurs/channex"
    );
    const corps = '{"event":"booking_new"}';
    const horodatage = String(Math.floor(Date.now() / 1000));
    const signature = createHmac("sha256", "channex-secret")
      .update(`${horodatage}.${corps}`)
      .digest("hex");
    const ok = await new ChannexFournisseur().verifierWebhook({
      headers: new Headers({
        "x-hmac-timestamp": horodatage,
        "x-hmac-signature-256": signature,
      }),
      corps,
    });
    expect(ok).toBe(true);
  });
});

describe("SmoobuFournisseur", () => {
  beforeEach(() => {
    vi.stubEnv("SMOOBU_API_KEY", "smoobu-key");
    vi.stubEnv("SMOOBU_API_SECRET", "smoobu-secret");
    vi.stubEnv("SMOOBU_API_BASE", "https://smoobu.test/api");
    vi.stubEnv("SMOOBU_WEBHOOK_SECRET", "smoobu-webhook");
  });

  it("signe la requête et refuse l’écriture de disponibilité", async () => {
    fetchMock.mockResolvedValue(reponseJson({ id: 7 }));
    const { SmoobuFournisseur } = await import(
      "@/infrastructure/adapters/fournisseurs/smoobu"
    );
    const fournisseur = new SmoobuFournisseur();
    const resultat = await fournisseur.testerConnexion();
    expect(resultat.ok).toBe(true);
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(entetes(init).get("x-api-key")).toBe("smoobu-key");
    expect(entetes(init).get("x-signature")).toBeTruthy();
    await expect(
      fournisseur.pousserDisponibilites([
        {
          externalPropertyId: "7",
          date: "2026-11-01",
          disponible: false,
        },
      ]),
    ).rejects.toMatchObject({ code: "FOURNISSEUR_NON_SUPPORTE" });
  });

  it("vérifie le secret partagé du webhook", async () => {
    const { SmoobuFournisseur } = await import(
      "@/infrastructure/adapters/fournisseurs/smoobu"
    );
    const fournisseur = new SmoobuFournisseur();
    expect(
      await fournisseur.verifierWebhook({
        headers: new Headers({ "x-webhook-secret": "smoobu-webhook" }),
        corps: "{}",
      }),
    ).toBe(true);
    expect(
      await fournisseur.verifierWebhook({
        headers: new Headers({ "x-webhook-secret": "faux" }),
        corps: "{}",
      }),
    ).toBe(false);
  });
});

describe("HostPortFournisseur", () => {
  beforeEach(() => {
    vi.stubEnv("HOSTPORT_API_KEY", "hostport-key");
    vi.stubEnv(
      "HOSTPORT_API_BASE",
      "https://hostport.test/functions/v1/data-api/v1",
    );
    vi.stubEnv("HOSTPORT_WEBHOOK_SECRET", "hostport-secret");
  });

  it("lit les réservations et refuse toute écriture", async () => {
    fetchMock.mockResolvedValue(
      reponseJson({
        rows: [
          {
            booking_id: "b1",
            property_id: "p1",
            status: "confirmed",
            check_in: "2026-11-01",
            check_out: "2026-11-03",
            total_amount: "120.50",
            currency: "EUR",
          },
        ],
        has_more: false,
      }),
    );
    const { HostPortFournisseur } = await import(
      "@/infrastructure/adapters/fournisseurs/hostport"
    );
    const fournisseur = new HostPortFournisseur();
    const reservations = await fournisseur.recupererReservations(
      "2026-11-01",
      "2026-11-30",
    );
    expect(reservations[0]?.montantCentimes).toBe(12050);
    await expect(
      fournisseur.pousserTarifs([
        {
          externalPropertyId: "p1",
          date: "2026-11-01",
          prixCentimes: 10000,
          devise: "EUR",
        },
      ]),
    ).rejects.toMatchObject({ code: "FOURNISSEUR_LECTURE_SEULE" });
  });

  it("vérifie la signature HMAC du webhook", async () => {
    const { HostPortFournisseur } = await import(
      "@/infrastructure/adapters/fournisseurs/hostport"
    );
    const corps = '{"event":"booking.created"}';
    const horodatage = String(Math.floor(Date.now() / 1000));
    const signature = `sha256=${createHmac("sha256", "hostport-secret")
      .update(`${horodatage}.${corps}`)
      .digest("hex")}`;
    const ok = await new HostPortFournisseur().verifierWebhook({
      headers: new Headers({
        "x-hostport-timestamp": horodatage,
        "x-hostport-signature": signature,
      }),
      corps,
    });
    expect(ok).toBe(true);
  });
});

describe("NobedsFournisseur", () => {
  beforeEach(() => {
    vi.stubEnv("NOBEDS_API_TOKEN", "nobeds-token");
    vi.stubEnv("NOBEDS_API_BASE", "https://nobeds.test");
    vi.stubEnv("NOBEDS_WEBHOOK_SECRET", "nobeds-webhook");
  });

  it("teste la connexion avec le token dans le chemin", async () => {
    fetchMock.mockResolvedValue(reponseJson({ hotel_id: 9, name: "Villa" }));
    const { NobedsFournisseur } = await import(
      "@/infrastructure/adapters/fournisseurs/nobeds"
    );
    const resultat = await new NobedsFournisseur().testerConnexion();
    expect(resultat.ok).toBe(true);
    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain("/api/hotels/nobeds-token");
  });

  it("pousse une disponibilité avec le prix obligatoire", async () => {
    fetchMock.mockResolvedValue(reponseJson({ success: true }));
    const { NobedsFournisseur } = await import(
      "@/infrastructure/adapters/fournisseurs/nobeds"
    );
    await new NobedsFournisseur().pousserDisponibilites([
      {
        externalPropertyId: "9",
        externalRoomTypeId: "12",
        date: "2026-11-01",
        disponible: false,
        prixCentimes: 9500,
      },
    ]);
    const [, init] = fetchMock.mock.calls[0] ?? [];
    const corps = JSON.parse(String(init?.body)) as {
      room_id: number;
      available: number;
      price: number;
    };
    expect(corps.room_id).toBe(12);
    expect(corps.available).toBe(0);
    expect(corps.price).toBe(95);
  });

  it("vérifie le secret partagé du webhook", async () => {
    const { NobedsFournisseur } = await import(
      "@/infrastructure/adapters/fournisseurs/nobeds"
    );
    const fournisseur = new NobedsFournisseur();
    expect(
      await fournisseur.verifierWebhook({
        headers: new Headers({ "x-webhook-secret": "nobeds-webhook" }),
        corps: "{}",
      }),
    ).toBe(true);
    expect(
      await fournisseur.verifierWebhook({
        headers: new Headers({ "x-webhook-secret": "faux" }),
        corps: "{}",
      }),
    ).toBe(false);
  });
});
