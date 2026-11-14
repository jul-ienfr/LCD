import { afterEach, describe, expect, it } from "vitest";
import {
  ajouterIncident,
  compterIncidents,
  listerIncidents,
  rejouerIncidents,
  type EntreeIncidentOutbox,
} from "@/lib/outbox";

/**
 * Rejeu de l'outbox sans doublon (T055).
 *
 * `src/lib/outbox.ts` s'appuie sur IndexedDB : ce test fournit une
 * implémentation en mémoire du strict contrat utilisé (`open`,
 * `createObjectStore`, `transaction`, `put`/`getAll`/`count`/`delete`) pour
 * prouver trois propriétés de l'ergonomie hors ligne :
 *
 * 1. la clé d'enregistrement est la `ref` : ré-empiler le même signalement ne
 *    crée pas de doublon local ;
 * 2. le rejeu ne renvoie chaque `ref` qu'une seule fois, sinon l'API devrait
 *    dédupliquer à chaque reprise ;
 * 3. une erreur réseau ou un 5xx conserve l'entrée (aucune perte silencieuse)
 *    et la `ref` stable reste dans le corps envoyé (idempotence côté serveur).
 */

type Requete<T> = {
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
  result: T;
};

type Magasin = { data: Map<string, EntreeIncidentOutbox> };

function repondre<T>(result: T): Requete<T> {
  const requete: Requete<T> = { onsuccess: null, onerror: null, result };
  setTimeout(() => requete.onsuccess?.(), 0);
  return requete;
}

/** Base IndexedDB minimale : un seul magasin `incidents` clé `ref`. */
function baseFactice() {
  const magasin: Magasin = { data: new Map() };

  const transaction = () => {
    const tx = {
      oncomplete: null as (() => void) | null,
      onerror: null as (() => void) | null,
      objectStore: () => ({
        put: (valeur: EntreeIncidentOutbox) => {
          magasin.data.set(valeur.ref, valeur);
          return repondre(valeur.ref);
        },
        getAll: () => repondre([...magasin.data.values()]),
        count: () => repondre(magasin.data.size),
        delete: (cle: string) => {
          magasin.data.delete(cle);
          return repondre(undefined);
        },
      }),
    };
    setTimeout(() => tx.oncomplete?.(), 0);
    return tx;
  };

  const base = {
    objectStoreNames: { contains: (nom: string) => nom === "incidents" },
    createObjectStore: () => magasin,
    transaction,
    close: () => {},
  };

  const indexedDB = {
    open: () => {
      const requete = {
        onupgradeneeded: null as (() => void) | null,
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
        result: base as unknown,
        error: null,
      };
      setTimeout(() => {
        requete.onupgradeneeded?.();
        requete.onsuccess?.();
      }, 0);
      return requete;
    },
  };

  return { indexedDB, magasin };
}

const indexedDbOrigine = globalThis.indexedDB;
const fetchOrigine = globalThis.fetch;

afterEach(() => {
  globalThis.indexedDB = indexedDbOrigine;
  globalThis.fetch = fetchOrigine;
});

function installer(): Magasin {
  const { indexedDB, magasin } = baseFactice();
  globalThis.indexedDB = indexedDB as unknown as IDBFactory;
  return magasin;
}

function entree(ref: string): EntreeIncidentOutbox {
  return {
    ref,
    token: "jeton-signé-de-test",
    message: "La clé ne fonctionne plus.",
    createdAt: "2026-11-12T09:30:00.000Z",
  };
}

describe("outbox incidents — rejeu idempotent (T055)", () => {
  it("empiler deux fois la même ref ne crée qu'une entrée locale", async () => {
    installer();
    await ajouterIncident(entree("ref-1"));
    await ajouterIncident(entree("ref-1"));
    expect(await compterIncidents()).toBe(1);

    await ajouterIncident(entree("ref-2"));
    expect(await compterIncidents()).toBe(2);
    expect((await listerIncidents()).map((e) => e.ref).sort()).toEqual([
      "ref-1",
      "ref-2",
    ]);
  });

  it("ne renvoie chaque ref qu'une fois et vide la file après succès", async () => {
    installer();
    await ajouterIncident(entree("ref-unique"));

    const corps: string[] = [];
    globalThis.fetch = (async (_url: string, options: { body: string }) => {
      corps.push(options.body);
      return { ok: true, status: 201 };
    }) as unknown as typeof fetch;

    const premier = await rejouerIncidents();
    expect(premier).toEqual({ envoyes: 1, restants: 0 });
    expect(corps).toHaveLength(1);

    // Deuxième rejeu : la file est vide, aucune requête supplémentaire.
    const second = await rejouerIncidents();
    expect(second).toEqual({ envoyes: 0, restants: 0 });
    expect(corps).toHaveLength(1);

    // La `ref` stable fait partie du corps envoyé (idempotence côté API).
    expect(JSON.parse(corps[0]!)).toMatchObject({
      ref: "ref-unique",
      message: "La clé ne fonctionne plus.",
    });
  });

  it("conserve l'entrée après une erreur réseau ou 5xx, puis la retire au succès", async () => {
    installer();
    await ajouterIncident(entree("ref-reseau"));

    globalThis.fetch = (async () => {
      throw new Error("réseau indisponible");
    }) as unknown as typeof fetch;
    expect(await rejouerIncidents()).toEqual({ envoyes: 0, restants: 1 });
    expect(await compterIncidents()).toBe(1);

    globalThis.fetch = (async () => ({ ok: false, status: 503 })) as unknown as typeof fetch;
    expect(await rejouerIncidents()).toEqual({ envoyes: 0, restants: 1 });
    expect(await compterIncidents()).toBe(1);

    globalThis.fetch = (async () => ({ ok: true, status: 200 })) as unknown as typeof fetch;
    expect(await rejouerIncidents()).toEqual({ envoyes: 1, restants: 0 });
    expect(await compterIncidents()).toBe(0);
  });

  it("retire une entrée définitivement refusée (4xx) sans la compter comme envoyée", async () => {
    installer();
    await ajouterIncident(entree("ref-refusee"));
    globalThis.fetch = (async () => ({ ok: false, status: 400 })) as unknown as typeof fetch;
    expect(await rejouerIncidents()).toEqual({ envoyes: 0, restants: 0 });
    expect(await compterIncidents()).toBe(0);
  });
});
