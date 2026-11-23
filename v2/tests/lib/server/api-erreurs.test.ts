/**
 * Erreurs des routes API (spec 006, FR-029).
 *
 * Un 5xx d'API ne part jamais en HTML : enveloppe JSON stable, non cachée,
 * avec la référence de requête ; `handleError` journalise déjà l'incident.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CODE_ERREUR_INTERNE_API,
  corpsErreurApi,
  doitNormaliserErreurApi,
  entetesErreurApi,
  estRequeteApi,
} from "@/lib/server/api-erreurs";

describe("erreurs des routes API (FR-029)", () => {
  it("reconnaît les chemins d'API, y compris la racine /api", () => {
    expect(estRequeteApi("/api")).toBe(true);
    expect(estRequeteApi("/api/v1/reservations")).toBe(true);
    expect(estRequeteApi("/apiculteur")).toBe(false);
    expect(estRequeteApi("/hote")).toBe(false);
  });

  it("normalise un 5xx d'API rendu en page HTML", () => {
    expect(
      doitNormaliserErreurApi({
        chemin: "/api/exports/paiements",
        statut: 500,
        contentType: "text/html; charset=utf-8",
      }),
    ).toBe(true);
  });

  it("laisse les 5xx déjà en JSON garder leur format", () => {
    expect(
      doitNormaliserErreurApi({
        chemin: "/api/v1/reservations",
        statut: 500,
        contentType: "application/json",
      }),
    ).toBe(false);
  });

  it("ne touche ni les pages ni les statuts < 500", () => {
    expect(
      doitNormaliserErreurApi({
        chemin: "/hote",
        statut: 500,
        contentType: "text/html",
      }),
    ).toBe(false);
    expect(
      doitNormaliserErreurApi({
        chemin: "/api/calendrier/x",
        statut: 404,
        contentType: "text/html",
      }),
    ).toBe(false);
  });

  it("l'enveloppe porte le code, le message et la référence, sans cache", () => {
    const corps = JSON.parse(corpsErreurApi("req-123")) as {
      error: { code: string; message: string };
      requestId: string;
    };
    expect(corps.error.code).toBe(CODE_ERREUR_INTERNE_API);
    expect(corps.error.message).toContain("journalisé");
    expect(corps.requestId).toBe("req-123");
    expect(entetesErreurApi("req-123")).toMatchObject({
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-request-id": "req-123",
    });
  });

  it("les hooks appliquent la normalisation et journalisent les 5xx", () => {
    const hooks = readFileSync(
      new URL("../../../src/hooks.server.ts", import.meta.url),
      "utf-8",
    );
    expect(hooks).toContain("doitNormaliserErreurApi({");
    expect(hooks).toContain("corpsErreurApi(requestId)");
    expect(hooks).toContain("entetesErreurApi(requestId)");
    // Le corps remplacé n'hérite pas de la longueur ni de l'empreinte HTML.
    expect(hooks).toContain('entetes.delete("content-length")');
    expect(hooks).toContain('entetes.delete("etag")');
    // handleError journalise dès qu'une erreur est inconnue ou porte un 500.
    expect(hooks).toContain('kind === "unknown" || statut >= 500');
    expect(hooks).toContain('logErreur("erreur.page", error, contexte)');
  });
});
