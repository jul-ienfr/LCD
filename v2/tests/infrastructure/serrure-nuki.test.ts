/**
 * T606 — Tests de l'adapter Nuki (serrure connectée).
 *
 * La config est injectée (`token`, `base`, `fetchImpl`) pour rendre les tests
 * déterministes sans toucher au singleton `env` et sans réseau réel. On vérifie
 * la disponibilité, la création de code (forme de la requête Nuki), la
 * révocation et son idempotence sur 404, ainsi que la propagation propre des
 * erreurs fournisseur.
 */
import { describe, expect, it } from "vitest";
import { creerSerrureNuki } from "@/infrastructure/adapters/serrures/nuki";
import { ErreurMetier } from "@/domain/erreurs";

const SERRURE = "12345";
const TOKEN = "token-nuki-test";
const BASE = "https://nuki.test";
const FENETRE = {
  valideDe: "2026-12-01T15:00:00.000Z",
  valideA: "2026-12-05T11:00:00.000Z",
};

function creerFetchMock(corps: unknown, statut = 200) {
  const appels: { url: string; init: RequestInit }[] = [];
  const impl = (async (url: RequestInfo | URL, init?: RequestInit) => {
    appels.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify(corps), {
      status: statut,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  return { impl, appels };
}

function entetesDe(appel: { init: RequestInit }): Record<string, string> {
  return (appel.init.headers ?? {}) as Record<string, string>;
}

describe("serrure Nuki : disponibilité", () => {
  it("est indisponible sans token", () => {
    expect(creerSerrureNuki({ token: "" }).estDisponible()).toBe(false);
  });

  it("est disponible avec un token", () => {
    expect(creerSerrureNuki({ token: TOKEN }).estDisponible()).toBe(true);
  });
});

describe("serrure Nuki : création de code", () => {
  it("refuse de créer sans token", async () => {
    const mock = creerFetchMock({ codeId: 1 });
    const serrure = creerSerrureNuki({ token: "", fetchImpl: mock.impl });
    await expect(
      serrure.creerCode({
        serrureId: SERRURE,
        code: "123456",
        nom: "Résa",
        ...FENETRE,
      }),
    ).rejects.toThrow(ErreurMetier);
    expect(mock.appels).toHaveLength(0);
  });

  it("refuse un code qui n'a pas exactement 6 chiffres", async () => {
    const mock = creerFetchMock({ codeId: 1 });
    const serrure = creerSerrureNuki({ token: TOKEN, fetchImpl: mock.impl });
    await expect(
      serrure.creerCode({
        serrureId: SERRURE,
        code: "1234",
        nom: "Résa",
        ...FENETRE,
      }),
    ).rejects.toThrow(/6 chiffres/);
    expect(mock.appels).toHaveLength(0);
  });

  it("crée un code et retourne l'identifiant externe", async () => {
    const mock = creerFetchMock({ codeId: 789 });
    const serrure = creerSerrureNuki({
      token: TOKEN,
      base: BASE,
      fetchImpl: mock.impl,
    });
    const resultat = await serrure.creerCode({
      serrureId: SERRURE,
      code: "123456",
      nom: "Résa Test",
      ...FENETRE,
    });
    expect(resultat.externalId).toBe("789");
    expect(mock.appels).toHaveLength(1);
    const appel = mock.appels[0]!;
    expect(appel.url).toBe(`${BASE}/smartlock/${SERRURE}/authorization`);
    expect(appel.init.method).toBe("PUT");
    expect(entetesDe(appel).Authorization).toBe(`Bearer ${TOKEN}`);
    const corps = JSON.parse(String(appel.init.body));
    expect(corps.codepin).toBe("123456");
    expect(corps.name).toBe("Résa Test");
    expect(corps.timeLimited).toEqual({
      from: FENETRE.valideDe,
      until: FENETRE.valideA,
    });
  });

  it("refuse une réponse Nuki sans identifiant de code", async () => {
    const mock = creerFetchMock({});
    const serrure = creerSerrureNuki({
      token: TOKEN,
      base: BASE,
      fetchImpl: mock.impl,
    });
    await expect(
      serrure.creerCode({
        serrureId: SERRURE,
        code: "123456",
        nom: "Résa",
        ...FENETRE,
      }),
    ).rejects.toThrow(/identifiant/);
  });

  it("propage une erreur fournisseur (409) sans retry", async () => {
    const mock = creerFetchMock({ message: "conflit" }, 409);
    const serrure = creerSerrureNuki({
      token: TOKEN,
      base: BASE,
      fetchImpl: mock.impl,
    });
    await expect(
      serrure.creerCode({
        serrureId: SERRURE,
        code: "123456",
        nom: "Résa",
        ...FENETRE,
      }),
    ).rejects.toThrow(ErreurMetier);
    expect(mock.appels).toHaveLength(1);
  });
});

describe("serrure Nuki : révocation", () => {
  it("révoque un code via DELETE", async () => {
    const mock = creerFetchMock({});
    const serrure = creerSerrureNuki({
      token: TOKEN,
      base: BASE,
      fetchImpl: mock.impl,
    });
    await serrure.revoquerCode({ serrureId: SERRURE, externalId: "789" });
    expect(mock.appels).toHaveLength(1);
    const appel = mock.appels[0]!;
    expect(appel.url).toBe(`${BASE}/smartlock/${SERRURE}/authorization/789`);
    expect(appel.init.method).toBe("DELETE");
    expect(entetesDe(appel).Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it("considère un code déjà supprimé comme révoqué (404 idempotent)", async () => {
    const mock = creerFetchMock({ message: "introuvable" }, 404);
    const serrure = creerSerrureNuki({
      token: TOKEN,
      base: BASE,
      fetchImpl: mock.impl,
    });
    await expect(
      serrure.revoquerCode({ serrureId: SERRURE, externalId: "789" }),
    ).resolves.toBeUndefined();
    expect(mock.appels).toHaveLength(1);
  });

  it("propage les autres erreurs de révocation", async () => {
    const mock = creerFetchMock({ message: "erreur serveur" }, 500);
    const serrure = creerSerrureNuki({
      token: TOKEN,
      base: BASE,
      fetchImpl: mock.impl,
    });
    await expect(
      serrure.revoquerCode({ serrureId: SERRURE, externalId: "789" }),
    ).rejects.toThrow(ErreurMetier);
  });

  it("refuse de révoquer sans token", async () => {
    const mock = creerFetchMock({});
    const serrure = creerSerrureNuki({ token: "", fetchImpl: mock.impl });
    await expect(
      serrure.revoquerCode({ serrureId: SERRURE, externalId: "789" }),
    ).rejects.toThrow(ErreurMetier);
    expect(mock.appels).toHaveLength(0);
  });
});
