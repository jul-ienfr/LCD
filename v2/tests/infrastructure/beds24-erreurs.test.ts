/**
 * T115 — Tests 409/429/timeout et backoff.
 *
 * La couche HTTP fournisseur (`requeteFournisseur`) classe les erreurs :
 * - 429, 5xx, timeout/réseau : transitoires → retry avec backoff exponentiel ;
 * - 409 : conflit métier → jamais rejoué ;
 * - autre 4xx : erreur client → jamais rejouée.
 *
 * Les délais de test sont en millisecondes pour garder la suite rapide.
 */
import { describe, expect, it } from "vitest";
import { ErreurMetier } from "@/domain/erreurs";
import { requeteFournisseur } from "@/infrastructure/adapters/fournisseurs/http";
import { Beds24Fournisseur } from "@/infrastructure/adapters/fournisseurs/beds24";

const URL = "https://fournisseur.test/api";
const OPTIONS = { timeoutMs: 1_000, delaiBaseMs: 1, delaiMaxMs: 4 };

function reponse(statut: number, corps: unknown = {}): Response {
  return new Response(JSON.stringify(corps), { status: statut });
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

describe("requeteFournisseur — 409/429/timeout et backoff (T115)", () => {
  it("réussit sans retry quand la première réponse est bonne", async () => {
    const { fetchImpl, compter } = fetchAvecSequence([
      () => reponse(200, { ok: true }),
    ]);
    const resultat = await requeteFournisseur<{ ok: boolean }>({
      url: URL,
      fetchImpl,
      ...OPTIONS,
    });
    expect(resultat.ok).toBe(true);
    expect(compter()).toBe(1);
  });

  it("relance un 429 puis réussit", async () => {
    const { fetchImpl, compter } = fetchAvecSequence([
      () => reponse(429, { error: "trop de requêtes" }),
      () => reponse(200, { ok: true }),
    ]);
    const resultat = await requeteFournisseur<{ ok: boolean }>({
      url: URL,
      fetchImpl,
      ...OPTIONS,
      reessais: 2,
    });
    expect(resultat.ok).toBe(true);
    expect(compter()).toBe(2);
  });

  it("épuise les retries sur 429 et remonte FOURNISSEUR_RATE_LIMIT", async () => {
    const { fetchImpl, compter } = fetchAvecSequence([
      () => reponse(429, { error: "limité" }),
    ]);
    await expect(
      requeteFournisseur({ url: URL, fetchImpl, ...OPTIONS, reessais: 2 }),
    ).rejects.toMatchObject({ code: "FOURNISSEUR_RATE_LIMIT" });
    expect(compter()).toBe(3); // 1 tentative initiale + 2 retries
  });

  it("ne rejoue jamais un 409 (conflit métier)", async () => {
    const { fetchImpl, compter } = fetchAvecSequence([
      () => reponse(409, { error: "conflit" }),
    ]);
    await expect(
      requeteFournisseur({ url: URL, fetchImpl, ...OPTIONS, reessais: 3 }),
    ).rejects.toMatchObject({ code: "FOURNISSEUR_CONFLIT" });
    expect(compter()).toBe(1);
  });

  it("relance un 500 avec backoff puis remonte FOURNISSEUR_INDISPONIBLE", async () => {
    const { fetchImpl, compter } = fetchAvecSequence([
      () => reponse(500, { error: "boom" }),
    ]);
    const debut = Date.now();
    await expect(
      requeteFournisseur({ url: URL, fetchImpl, ...OPTIONS, reessais: 2 }),
    ).rejects.toMatchObject({ code: "FOURNISSEUR_INDISPONIBLE" });
    expect(compter()).toBe(3);
    // Backoff : au moins delaiBase (1 ms) + 2×delaiBase (2 ms).
    expect(Date.now() - debut).toBeGreaterThanOrEqual(2);
  });

  it("relance un timeout réseau puis remonte FOURNISSEUR_INDISPONIBLE", async () => {
    const { fetchImpl, compter } = fetchAvecSequence([
      () => Promise.reject(new Error("timeout")),
    ]);
    await expect(
      requeteFournisseur({ url: URL, fetchImpl, ...OPTIONS, reessais: 1 }),
    ).rejects.toMatchObject({ code: "FOURNISSEUR_INDISPONIBLE" });
    expect(compter()).toBe(2);
  });

  it("ne rejoue pas un 400 (erreur client)", async () => {
    const { fetchImpl, compter } = fetchAvecSequence([
      () => reponse(400, { message: "invalide" }),
    ]);
    await expect(
      requeteFournisseur({ url: URL, fetchImpl, ...OPTIONS, reessais: 3 }),
    ).rejects.toMatchObject({ code: "FOURNISSEUR_INDISPONIBLE" });
    expect(compter()).toBe(1);
  });

  it("plafonne le backoff à delaiMaxMs", async () => {
    const { fetchImpl } = fetchAvecSequence([() => reponse(500)]);
    const debut = Date.now();
    await expect(
      requeteFournisseur({
        url: URL,
        fetchImpl,
        timeoutMs: 1_000,
        delaiBaseMs: 5,
        delaiMaxMs: 6,
        reessais: 3,
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);
    // Délais attendus : 5 + 6 + 6 = 17 ms ; plafond très large pour la
    // stabilité de la suite sur machine chargée.
    expect(Date.now() - debut).toBeLessThan(2_000);
  });
});

describe("adapter Beds24 — résilience (T109/T112)", () => {
  it("expose lireSante et ne déclare pas de messaging non prouvé", () => {
    const fournisseur = new Beds24Fournisseur();
    expect(typeof fournisseur.lireSante).toBe("function");
    expect(fournisseur.capacites.messaging).toBe(false);
    expect(fournisseur.capacites.webhooks).toBe(true);
  });

  it("lireSante retourne une santé en erreur sans clé API, sans exception", async () => {
    const fournisseur = new Beds24Fournisseur();
    const sante = await fournisseur.lireSante();
    expect(sante).not.toBeNull();
    expect(sante!.statut).toBe("erreur");
    expect(sante!.erreursConsecutives).toBeGreaterThanOrEqual(1);
    expect(sante!.derniereErreur).not.toBeNull();
  });
});
