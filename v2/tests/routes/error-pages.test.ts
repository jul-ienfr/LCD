/**
 * Gardes statiques de FR-020 (spec 006) : chaque surface possède sa page
 * d'erreur dédiée, le composant partagé affiche la référence de requête et
 * une sortie propre à la surface, et `handleError` journalise l'identifiant.
 *
 * La page racine reste le repli pour les routes sans surface (API exclue).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const racineV2 = new URL("../../", import.meta.url);

function lire(cheminRelatifDepuisV2: string): string {
  return readFileSync(new URL(cheminRelatifDepuisV2, racineV2), "utf-8");
}

describe("pages d'erreur par surface (FR-020)", () => {
  const surfaces = [
    "hote",
    "presta",
    "proprio",
    "voyageur",
    "commercial",
    "support",
    "supervision",
  ] as const;

  it.each(surfaces)("%s possède sa page d'erreur dédiée", (surface) => {
    const page = lire(`src/routes/${surface}/+error.svelte`);
    expect(page.length).toBeGreaterThan(0);
  });

  it("le composant partagé affiche la référence et une sortie vers la surface", () => {
    const composant = lire("src/lib/components/erreur-surface.svelte");
    expect(composant).toContain("requestId");
    expect(composant).toContain("Référence");
    expect(composant).toContain("href={accueil}");
  });

  it("la page racine reste le repli et handleError journalise l'identifiant", () => {
    expect(lire("src/routes/+error.svelte")).toContain("requestId");
    const hooks = lire("src/hooks.server.ts");
    expect(hooks).toContain("export const handleError");
    expect(hooks).toContain("event.locals.requestId");
    expect(hooks).toContain('entetes.set("x-request-id", requestId)');
  });
});
