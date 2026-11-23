/**
 * FR-037 — Garde-fous de la migration 0115 (visibilité des preuves).
 *
 * L'application réelle (colonne, contrainte, défaut) est vérifiée par
 * `npm run db:test-migrations` sur une base jetable. Ce test statique verrouille
 * le SQL : le réglage est idempotent, borné aux trois niveaux du domaine et
 * posé sur les mandats existants sans les casser.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { VISIBILITES_PREUVES } from "@/domain/visibilite-proprietaire";

const migration = readFileSync(
  new URL(
    "../../drizzle/0115_visibilite_preuves_proprietaire.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("Visibilité des preuves propriétaire FR-037 : migration 0115", () => {
  it("ajoute le réglage de façon idempotente, avec un défaut non nul", () => {
    expect(migration).toContain('ALTER TABLE "logement_proprietaires"');
    expect(migration).toContain(
      'ADD COLUMN IF NOT EXISTS "visibilite_preuves" text NOT NULL DEFAULT \'resume\'',
    );
  });

  it("pose la contrainte sans échouer si elle existe déjà", () => {
    expect(migration).toContain("DO $$");
    expect(migration).toContain(
      "IF NOT EXISTS (\n    SELECT 1 FROM pg_constraint\n    WHERE conname = 'logement_proprietaires_visibilite_check'",
    );
    expect(migration).toContain(
      'ADD CONSTRAINT "logement_proprietaires_visibilite_check"',
    );
  });

  it("borne le réglage exactement aux trois niveaux du domaine", () => {
    const niveaux = VISIBILITES_PREUVES.map((niveau) => `'${niveau}'`).join(", ");
    expect(migration).toContain(
      `CHECK ("visibilite_preuves" IN (${niveaux}))`,
    );
    expect(niveaux).toBe("'masquee', 'resume', 'complete'");
  });
});
