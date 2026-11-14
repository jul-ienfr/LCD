import { describe, expect, it } from "vitest";
import type { ClesApiRepository } from "@/application/ports/api-integrations";
import { creerCleApi, type CleApi } from "@/domain/cle-api";
import { authentifierApi, erreurApi } from "@/lib/server/api-auth";
import { creerRateLimiter } from "@/lib/server/rate-limit";

function cleDeTest(overrides: Partial<CleApi> = {}): {
  cle: string;
  entite: CleApi;
} {
  const { cle, entite } = creerCleApi({
    id: "cle-1",
    tenantId: "tenant-1",
    nom: "Test API",
    scopes: ["logements:lire"],
    maintenant: "2026-11-10T10:00:00.000Z",
  });
  return { cle, entite: { ...entite, ...overrides } };
}

function depot(entite: CleApi | null): ClesApiRepository {
  return {
    trouverParHash: async (hash: string) =>
      entite && entite.hash === hash ? entite : null,
    marquerUsage: async () => {},
  } as unknown as ClesApiRepository;
}

function requete(cle?: string, entetes: Record<string, string> = {}) {
  const headers = new Headers(entetes);
  if (cle) headers.set("authorization", `Bearer ${cle}`);
  const request = new Request("https://api.test/api/v1/logements", { headers });
  return { request, url: new URL(request.url) };
}

describe("API v1 — authentification", () => {
  it("refuse une requête sans en-tête Bearer", async () => {
    const resultat = await authentifierApi(requete(), "logements:lire", {
      repo: depot(null),
    });
    expect(resultat.ok).toBe(false);
    if (resultat.ok) return;
    expect(resultat.reponse.status).toBe(401);
    expect(await resultat.reponse.json()).toMatchObject({
      erreur: { code: "non_autorise" },
    });
  });

  it("refuse une clé inconnue", async () => {
    const resultat = await authentifierApi(
      requete("lcd_inconnue"),
      "logements:lire",
      { repo: depot(null) },
    );
    expect(resultat.ok).toBe(false);
    if (resultat.ok) return;
    expect(resultat.reponse.status).toBe(401);
  });

  it("refuse une clé révoquée", async () => {
    const { cle, entite } = cleDeTest({
      revoqueLe: "2026-11-10T11:00:00.000Z",
    });
    const resultat = await authentifierApi(requete(cle), "logements:lire", {
      repo: depot(entite),
    });
    expect(resultat.ok).toBe(false);
    if (resultat.ok) return;
    expect(resultat.reponse.status).toBe(401);
    expect(await resultat.reponse.json()).toMatchObject({
      erreur: { code: "cle_invalide" },
    });
  });

  it("refuse une clé expirée", async () => {
    const { cle, entite } = cleDeTest({
      expireLe: "2026-11-01T00:00:00.000Z",
    });
    const resultat = await authentifierApi(requete(cle), "logements:lire", {
      repo: depot(entite),
      maintenant: new Date("2026-11-10T10:00:00.000Z"),
    });
    expect(resultat.ok).toBe(false);
    if (resultat.ok) return;
    expect(resultat.reponse.status).toBe(401);
  });

  it("refuse un scope absent avec 403", async () => {
    const { cle, entite } = cleDeTest();
    const resultat = await authentifierApi(requete(cle), "prix:lire", {
      repo: depot(entite),
    });
    expect(resultat.ok).toBe(false);
    if (resultat.ok) return;
    expect(resultat.reponse.status).toBe(403);
    expect(await resultat.reponse.json()).toMatchObject({
      erreur: { code: "scope_insuffisant" },
    });
  });

  it("accepte une clé valide, trace l'usage et journalise", async () => {
    const { cle, entite } = cleDeTest();
    const usages: string[] = [];
    const journaux: string[] = [];
    const resultat = await authentifierApi(requete(cle), "logements:lire", {
      repo: {
        trouverParHash: async (hash: string) =>
          entite.hash === hash ? entite : null,
        marquerUsage: async (tenantId: string, id: string) => {
          usages.push(`${tenantId}:${id}`);
        },
      } as unknown as ClesApiRepository,
      journaliser: async (_cle, _requete, scope) => {
        journaux.push(scope);
      },
    });
    expect(resultat.ok).toBe(true);
    if (!resultat.ok) return;
    expect(usages).toEqual(["tenant-1:cle-1"]);
    expect(journaux).toEqual(["logements:lire"]);
    expect(resultat.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(resultat.headers["x-ratelimit-limit"]).toBe("120");
  });

  it("reprend un X-Request-Id fourni", async () => {
    const { cle, entite } = cleDeTest();
    const resultat = await authentifierApi(
      requete(cle, { "x-request-id": "req-test-123" }),
      "logements:lire",
      {
        repo: depot(entite),
        journaliser: async () => {},
      },
    );
    expect(resultat.ok).toBe(true);
    if (!resultat.ok) return;
    expect(resultat.requestId).toBe("req-test-123");
    expect(resultat.headers["x-request-id"]).toBe("req-test-123");
  });

  it("renvoie 429 au-delà de la limite de la fenêtre", async () => {
    const { cle, entite } = cleDeTest();
    const limiteur = creerRateLimiter({ max: 2, fenetreMs: 60_000 });
    const options = {
      repo: depot(entite),
      limiteur,
      journaliser: async () => {},
    };
    expect(
      (await authentifierApi(requete(cle), "logements:lire", options)).ok,
    ).toBe(true);
    expect(
      (await authentifierApi(requete(cle), "logements:lire", options)).ok,
    ).toBe(true);
    const troisieme = await authentifierApi(
      requete(cle),
      "logements:lire",
      options,
    );
    expect(troisieme.ok).toBe(false);
    if (troisieme.ok) return;
    expect(troisieme.reponse.status).toBe(429);
    expect(troisieme.reponse.headers.get("retry-after")).toBe("60");
  });

  it("produit une erreur JSON homogène avec requestId", async () => {
    const reponse = erreurApi(404, "introuvable", "Ressource absente", "req-1");
    expect(reponse.status).toBe(404);
    expect(reponse.headers.get("x-request-id")).toBe("req-1");
    expect(await reponse.json()).toEqual({
      erreur: { code: "introuvable", message: "Ressource absente" },
      requestId: "req-1",
    });
  });
});
