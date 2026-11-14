/**
 * T611 — Contrat de l'adapter Nuki.
 *
 * Deux niveaux :
 * 1. contrat de forme, toujours exécuté : la requête envoyée à Nuki doit
 *    respecter l'API Web (`PUT /smartlock/{id}/authorization`, corps
 *    `{ codepin, name, timeLimited }`, `DELETE …/authorization/{codeId}`) et
 *    un 404 de révocation doit rester idempotent ;
 * 2. contrat sandbox, opt-in : sans `SANDBOX_TESTS=1`, `NUKI_API_TOKEN` et
 *    `NUKI_SANDBOX_SERRURE_ID`, le test réel est sauté (jamais exécuté par
 *    défaut, comme les autres contrats fournisseurs).
 */
import { describe, expect, it } from "vitest";
import { ErreurMetier } from "@/domain/erreurs";
import { creerSerrureNuki } from "@/infrastructure/adapters/serrures/nuki";
import { evaluerSandbox, TIMEOUT_SANDBOX_MS } from "./harnais";

const BASE = "https://nuki.test";
const SERRURE = "12345";
const FENETRE = {
  valideDe: "2026-12-01T15:00:00.000Z",
  valideA: "2026-12-05T11:00:00.000Z",
};

function fetchEspion(reponse: unknown, statut = 200) {
  const appels: { url: string; methode: string; corps: unknown }[] = [];
  const impl = (async (url: RequestInfo | URL, init?: RequestInit) => {
    appels.push({
      url: String(url),
      methode: init?.method ?? "GET",
      corps: init?.body ? JSON.parse(String(init.body)) : null,
    });
    return new Response(statut === 204 ? null : JSON.stringify(reponse), {
      status: statut,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  return { impl, appels };
}

describe("contrat Nuki : forme des requêtes", () => {
  it("programme un code avec codepin, nom et fenêtre limitée", async () => {
    const espion = fetchEspion({ codeId: 987 });
    const serrure = creerSerrureNuki({
      token: "jeton",
      base: BASE,
      fetchImpl: espion.impl,
    });

    const resultat = await serrure.creerCode({
      serrureId: SERRURE,
      code: "123456",
      nom: "Résa REF-1",
      ...FENETRE,
    });

    expect(resultat.externalId).toBe("987");
    expect(espion.appels).toHaveLength(1);
    const appel = espion.appels[0]!;
    expect(appel.methode).toBe("PUT");
    expect(appel.url).toContain(`/smartlock/${SERRURE}/authorization`);
    expect(appel.corps).toMatchObject({
      codepin: "123456",
      name: "Résa REF-1",
    });
    expect(appel.corps).toHaveProperty("timeLimited");
  });

  it("révoque un code par son identifiant fournisseur", async () => {
    const espion = fetchEspion({}, 204);
    const serrure = creerSerrureNuki({
      token: "jeton",
      base: BASE,
      fetchImpl: espion.impl,
    });

    await serrure.revoquerCode({ serrureId: SERRURE, externalId: "987" });

    expect(espion.appels[0]!.methode).toBe("DELETE");
    expect(espion.appels[0]!.url).toContain(
      `/smartlock/${SERRURE}/authorization/987`,
    );
  });

  it("reste idempotent quand le code a déjà disparu (404)", async () => {
    const espion = fetchEspion({ detail: "not found" }, 404);
    const serrure = creerSerrureNuki({
      token: "jeton",
      base: BASE,
      fetchImpl: espion.impl,
    });

    await expect(
      serrure.revoquerCode({ serrureId: SERRURE, externalId: "987" }),
    ).resolves.toBeUndefined();
  });

  it("refuse un code qui n'est pas à 6 chiffres sans appeler Nuki", async () => {
    const espion = fetchEspion({ codeId: 1 });
    const serrure = creerSerrureNuki({
      token: "jeton",
      base: BASE,
      fetchImpl: espion.impl,
    });

    await expect(
      serrure.creerCode({ serrureId: SERRURE, code: "12ab", nom: "x", ...FENETRE }),
    ).rejects.toThrow(ErreurMetier);
    expect(espion.appels).toHaveLength(0);
  });
});

const sandbox = evaluerSandbox([
  "NUKI_API_TOKEN",
  "NUKI_SANDBOX_SERRURE_ID",
]);

describe.skipIf(!sandbox.actif)("contrat Nuki : sandbox réelle", () => {
  it(
    "programme puis révoque un code sur une serrure de test",
    async () => {
      const serrure = creerSerrureNuki({
        token: process.env.NUKI_API_TOKEN,
      });
      const serrureId = process.env.NUKI_SANDBOX_SERRURE_ID!;
      expect(serrure.estDisponible()).toBe(true);

      const cree = await serrure.creerCode({
        serrureId,
        code: "135790",
        nom: `Contrat LCD ${new Date().toISOString()}`,
        ...FENETRE,
      });
      expect(cree.externalId).toBeTruthy();

      await serrure.revoquerCode({ serrureId, externalId: cree.externalId });
      // Une seconde révocation doit rester silencieuse (idempotence).
      await serrure.revoquerCode({ serrureId, externalId: cree.externalId });
    },
    TIMEOUT_SANDBOX_MS,
  );
});
