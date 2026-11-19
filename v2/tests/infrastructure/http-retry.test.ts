import { describe, expect, it } from "vitest";
import { fetchAvecReessais } from "@/infrastructure/adapters/http-retry";

const OPTIONS = { timeoutMs: 1_000, delaiBaseMs: 1, delaiMaxMs: 4 };

function reponse(statut: number): Response {
  return new Response(JSON.stringify({}), { status: statut });
}

function fetchAvecSequence(
  sequence: (() => Response | Promise<Response>)[],
): { fetchImpl: typeof fetch; compter: () => number } {
  let appels = 0;
  const fetchImpl = (async () => {
    const etape = sequence[Math.min(appels, sequence.length - 1)];
    appels += 1;
    return await etape!();
  }) as unknown as typeof fetch;
  return { fetchImpl, compter: () => appels };
}

describe("fetchAvecReessais", () => {
  it("retourne la première réponse quand elle est bonne", async () => {
    const { fetchImpl, compter } = fetchAvecSequence([() => reponse(200)]);
    const resultat = await fetchAvecReessais("https://test.local", {}, {
      ...OPTIONS,
      fetchImpl,
    });
    expect(resultat.status).toBe(200);
    expect(compter()).toBe(1);
  });

  it("rejoue un 429 puis retourne le succès", async () => {
    const { fetchImpl, compter } = fetchAvecSequence([
      () => reponse(429),
      () => reponse(200),
    ]);
    const resultat = await fetchAvecReessais("https://test.local", {}, {
      ...OPTIONS,
      fetchImpl,
    });
    expect(resultat.status).toBe(200);
    expect(compter()).toBe(2);
  });

  it("rejoue un 503 jusqu'à la limite puis retourne le dernier statut", async () => {
    const { fetchImpl, compter } = fetchAvecSequence([() => reponse(503)]);
    const resultat = await fetchAvecReessais("https://test.local", {}, {
      ...OPTIONS,
      fetchImpl,
      reessais: 2,
    });
    expect(resultat.status).toBe(503);
    expect(compter()).toBe(3);
  });

  it("ne rejoue jamais un 4xx métier", async () => {
    for (const statut of [400, 401, 402, 404, 409, 422]) {
      const { fetchImpl, compter } = fetchAvecSequence([() => reponse(statut)]);
      const resultat = await fetchAvecReessais("https://test.local", {}, {
        ...OPTIONS,
        fetchImpl,
      });
      expect(resultat.status).toBe(statut);
      expect(compter()).toBe(1);
    }
  });

  it("rejoue une erreur réseau puis relance la dernière erreur", async () => {
    const { fetchImpl, compter } = fetchAvecSequence([
      () => Promise.reject(new Error("ECONNRESET")),
    ]);
    await expect(
      fetchAvecReessais("https://test.local", {}, {
        ...OPTIONS,
        fetchImpl,
        reessais: 1,
      }),
    ).rejects.toThrow("ECONNRESET");
    expect(compter()).toBe(2);
  });

  it("réussit après une erreur réseau transitoire", async () => {
    const { fetchImpl, compter } = fetchAvecSequence([
      () => Promise.reject(new Error("timeout")),
      () => reponse(200),
    ]);
    const resultat = await fetchAvecReessais("https://test.local", {}, {
      ...OPTIONS,
      fetchImpl,
    });
    expect(resultat.status).toBe(200);
    expect(compter()).toBe(2);
  });

  it("applique le backoff plafonné entre les tentatives", async () => {
    const { fetchImpl } = fetchAvecSequence([() => reponse(500)]);
    const debut = Date.now();
    await fetchAvecReessais("https://test.local", {}, {
      timeoutMs: 1_000,
      delaiBaseMs: 5,
      delaiMaxMs: 6,
      reessais: 3,
      fetchImpl,
    });
    // Délais attendus : 5 + 6 + 6 = 17 ms ; plafond large pour la stabilité.
    expect(Date.now() - debut).toBeLessThan(2_000);
  });

  it("transmet la méthode et les en-têtes à chaque tentative", async () => {
    const appels: RequestInit[] = [];
    const fetchImpl = (async (_url: string | URL, init?: RequestInit) => {
      appels.push(init ?? {});
      return reponse(appels.length === 1 ? 500 : 200);
    }) as unknown as typeof fetch;
    await fetchAvecReessais(
      "https://test.local",
      {
        method: "POST",
        headers: { "Idempotency-Key": "cle-1" },
        body: "x",
      },
      { ...OPTIONS, fetchImpl },
    );
    expect(appels).toHaveLength(2);
    for (const init of appels) {
      expect(init.method).toBe("POST");
      expect(
        new Headers(init.headers).get("Idempotency-Key"),
      ).toBe("cle-1");
    }
  });

  it("ne rejoue pas une erreur réseau quand rejouerErreurReseau est false", async () => {
    const { fetchImpl, compter } = fetchAvecSequence([
      () => Promise.reject(new Error("timeout")),
      () => reponse(200),
    ]);
    await expect(
      fetchAvecReessais("https://test.local", {}, {
        ...OPTIONS,
        fetchImpl,
        rejouerErreurReseau: false,
      }),
    ).rejects.toThrow("timeout");
    expect(compter()).toBe(1);
  });

  it("rejoue quand même un 429 refusé explicitement (envoi sans idempotence)", async () => {
    const { fetchImpl, compter } = fetchAvecSequence([
      () => reponse(429),
      () => reponse(200),
    ]);
    const resultat = await fetchAvecReessais("https://test.local", {}, {
      ...OPTIONS,
      fetchImpl,
      rejouerErreurReseau: false,
    });
    expect(resultat.status).toBe(200);
    expect(compter()).toBe(2);
  });
});
