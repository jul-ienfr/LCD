import { describe, expect, it } from "vitest";
import {
  cleApiUtilisable,
  creerCleApi,
  genererCleApi,
  hacherCleApi,
  normaliserScopes,
  prefixeCleApi,
  revoquerCleApi,
  scopeAutorise,
  type CleApi,
} from "@/domain/cle-api";
import { ErreurMetier } from "@/domain/erreurs";

function cleFactice(overrides: Partial<CleApi> = {}): CleApi {
  return {
    id: "cle-1",
    tenantId: "tenant-1",
    nom: "Intégration test",
    prefixe: "lcd_abcdefgh",
    hash: "a".repeat(64),
    scopes: ["logements:lire"],
    expireLe: null,
    creeLe: "2026-11-10T10:00:00.000Z",
    dernierUsageLe: null,
    revoqueLe: null,
    ...overrides,
  };
}

describe("clé API — génération et empreinte", () => {
  it("génère une clé préfixée, un préfixe court et un hash SHA-256", () => {
    const generee = genererCleApi();
    expect(generee.cle.startsWith("lcd_")).toBe(true);
    expect(generee.cle.length).toBeGreaterThan(40);
    expect(generee.prefixe).toHaveLength(12);
    expect(generee.cle.startsWith(generee.prefixe)).toBe(true);
    expect(generee.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(generee.hash).toBe(hacherCleApi(generee.cle));
  });

  it("ne produit jamais deux fois la même clé", () => {
    const cles = new Set(
      Array.from({ length: 50 }, () => genererCleApi().cle),
    );
    expect(cles.size).toBe(50);
  });

  it("dérive le préfixe sans exposer le secret", () => {
    const cle = "lcd_abcdefghijklmnop";
    expect(prefixeCleApi(cle)).toBe("lcd_abcdefgh");
    expect(prefixeCleApi(cle).length).toBeLessThan(cle.length);
  });
});

describe("clé API — création", () => {
  it("normalise le nom et déduplique les scopes", () => {
    const { cle, entite } = creerCleApi({
      id: "cle-1",
      tenantId: "tenant-1",
      nom: "  Zapier  ",
      scopes: ["logements:lire", "logements:lire", "reservations:lire"],
      maintenant: "2026-11-10T10:00:00.000Z",
    });
    expect(entite.nom).toBe("Zapier");
    expect(entite.scopes).toEqual(["logements:lire", "reservations:lire"]);
    expect(entite.creeLe).toBe("2026-11-10T10:00:00.000Z");
    expect(entite.revoqueLe).toBeNull();
    expect(entite.hash).toBe(hacherCleApi(cle));
  });

  it("accepte une expiration future et la normalise en ISO", () => {
    const { entite } = creerCleApi({
      id: "cle-1",
      tenantId: "tenant-1",
      nom: "Partenaire",
      scopes: ["prix:lire"],
      expireLe: "2027-01-01T00:00:00.000Z",
      maintenant: "2026-11-10T10:00:00.000Z",
    });
    expect(entite.expireLe).toBe("2027-01-01T00:00:00.000Z");
  });

  it("refuse un nom vide, trop court ou trop long", () => {
    for (const nom of ["", " ", "a", "x".repeat(81)]) {
      expect(() =>
        creerCleApi({
          id: "cle-1",
          tenantId: "tenant-1",
          nom,
          scopes: ["logements:lire"],
        }),
      ).toThrow(ErreurMetier);
    }
  });

  it("refuse une clé sans scope ou avec un scope inconnu", () => {
    expect(() => normaliserScopes([])).toThrow(ErreurMetier);
    expect(() => normaliserScopes(["logements:ecrire"])).toThrow(ErreurMetier);
  });

  it("refuse une expiration passée ou invalide", () => {
    for (const expireLe of ["2026-01-01T00:00:00.000Z", "pas-une-date"]) {
      expect(() =>
        creerCleApi({
          id: "cle-1",
          tenantId: "tenant-1",
          nom: "Partenaire",
          scopes: ["logements:lire"],
          expireLe,
          maintenant: "2026-11-10T10:00:00.000Z",
        }),
      ).toThrow(ErreurMetier);
    }
  });
});

describe("clé API — validité et scopes", () => {
  it("est utilisable sans expiration, puis jusqu'à l'expiration", () => {
    expect(cleApiUtilisable(cleFactice())).toBe(true);
    expect(
      cleApiUtilisable(cleFactice({ expireLe: "2027-01-01T00:00:00.000Z" })),
    ).toBe(true);
    expect(
      cleApiUtilisable(cleFactice({ expireLe: "2026-01-01T00:00:00.000Z" })),
    ).toBe(false);
  });

  it("n'est plus utilisable après révocation", () => {
    expect(cleApiUtilisable(cleFactice({ revoqueLe: "2026-11-10T11:00:00Z" }))).toBe(
      false,
    );
  });

  it("autorise uniquement les scopes portés par une clé valide", () => {
    const cle = cleFactice({ scopes: ["logements:lire"] });
    expect(scopeAutorise(cle, "logements:lire")).toBe(true);
    expect(scopeAutorise(cle, "prix:lire")).toBe(false);
    expect(
      scopeAutorise({ ...cle, revoqueLe: "2026-11-10T11:00:00Z" }, "logements:lire"),
    ).toBe(false);
  });

  it("révoque de façon idempotente en conservant la première date", () => {
    const premiere = revoquerCleApi(cleFactice(), {
      maintenant: "2026-11-10T12:00:00.000Z",
    });
    expect(premiere.revoqueLe).toBe("2026-11-10T12:00:00.000Z");
    const seconde = revoquerCleApi(premiere, {
      maintenant: "2026-12-01T12:00:00.000Z",
    });
    expect(seconde.revoqueLe).toBe("2026-11-10T12:00:00.000Z");
  });
});
