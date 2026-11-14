/**
 * T708 — Contrat de l'API v1.
 *
 * Vérifie sans base : le document OpenAPI (six chemins, scopes, sécurité),
 * le format de pagination, les en-têtes de traçabilité et la forme des
 * erreurs. L'authentification elle-même est couverte par
 * `tests/lib/api-auth.test.ts`.
 */
import { describe, expect, it } from "vitest";
import { dateIsoValide } from "@/domain/calendrier";
import { erreurApi } from "@/lib/server/api-auth";
import { documentOpenApi } from "@/lib/server/api-openapi";
import {
  dateRequise,
  parametreRequis,
  parametresPagination,
  reponseListe,
  reponseObjet,
} from "@/lib/server/api-v1";

const ORIGINE = "https://app.lcd.test";
const ENTETES = { "x-ratelimit-remaining": "119" };

describe("contrat API v1 : OpenAPI", () => {
  const document = documentOpenApi(ORIGINE) as {
    openapi: string;
    servers: { url: string }[];
    paths: Record<string, { get: { security: { cleApi: string[] }[] } }>;
    components: {
      securitySchemes: Record<string, unknown>;
      schemas: Record<string, unknown>;
    };
  };

  it("publie OpenAPI 3.1 sur l'origine réelle", () => {
    expect(document.openapi).toBe("3.1.0");
    expect(document.servers).toEqual([{ url: ORIGINE }]);
    expect(document.components.securitySchemes).toHaveProperty("cleApi");
    expect(document.components.schemas).toHaveProperty("Erreur");
    expect(document.components.schemas).toHaveProperty("Pagination");
  });

  it("déclare les six ressources avec le scope attendu", () => {
    const attendus: Record<string, string> = {
      "/api/v1/logements": "logements:lire",
      "/api/v1/reservations": "reservations:lire",
      "/api/v1/disponibilites": "disponibilites:lire",
      "/api/v1/prix": "prix:lire",
      "/api/v1/proprietaires": "proprietaires:lire",
      "/api/v1/releves": "releves:lire",
    };
    for (const [chemin, scope] of Object.entries(attendus)) {
      expect(document.paths[chemin]?.get.security).toEqual([
        { cleApi: [scope] },
      ]);
    }
  });
});

describe("contrat API v1 : pagination", () => {
  it("borne page et limite", () => {
    expect(parametresPagination(new URL("https://x.test/?page=0&limite=999"))).toEqual(
      { page: 1, limite: 200, offset: 0 },
    );
    expect(
      parametresPagination(new URL("https://x.test/?page=3&limite=10")),
    ).toEqual({ page: 3, limite: 10, offset: 20 });
  });

  it("retourne data, total et pages", async () => {
    const url = new URL("https://x.test/?page=2&limite=2");
    const reponse = reponseListe(url, [1, 2, 3], "req-1", ENTETES);
    expect(reponse.status).toBe(200);
    expect(reponse.headers.get("x-request-id")).toBe("req-1");
    expect(reponse.headers.get("cache-control")).toBe("no-store");
    expect(await reponse.json()).toEqual({
      data: [3],
      pagination: { page: 2, limite: 2, total: 3, pages: 2 },
    });
  });

  it("retourne un objet unique sous data", async () => {
    const reponse = reponseObjet({ ok: true }, "req-2", ENTETES);
    expect(await reponse.json()).toEqual({ data: { ok: true } });
  });
});

describe("contrat API v1 : erreurs et paramètres", () => {
  it("formate une erreur avec requestId", async () => {
    const reponse = erreurApi(404, "introuvable", "Absent", "req-3");
    expect(reponse.status).toBe(404);
    expect(await reponse.json()).toEqual({
      erreur: { code: "introuvable", message: "Absent" },
      requestId: "req-3",
    });
  });

  it("refuse une date manquante ou invalide", async () => {
    const sansDate = dateRequise(
      new URL("https://x.test/"),
      "debut",
      "req-4",
      ENTETES,
      dateIsoValide,
    );
    expect(sansDate).toBeInstanceOf(Response);
    const mauvaise = dateRequise(
      new URL("https://x.test/?debut=2026-02-31"),
      "debut",
      "req-4",
      ENTETES,
      dateIsoValide,
    );
    expect(mauvaise).toBeInstanceOf(Response);
    const bonne = dateRequise(
      new URL("https://x.test/?debut=2026-12-01"),
      "debut",
      "req-4",
      ENTETES,
      dateIsoValide,
    );
    expect(bonne).toBe("2026-12-01");
  });

  it("exige un paramètre texte non vide", () => {
    expect(
      parametreRequis(new URL("https://x.test/"), "logementId", "req-5", ENTETES),
    ).toBeInstanceOf(Response);
    expect(
      parametreRequis(
        new URL("https://x.test/?logementId=abc"),
        "logementId",
        "req-5",
        ENTETES,
      ),
    ).toBe("abc");
  });
});
