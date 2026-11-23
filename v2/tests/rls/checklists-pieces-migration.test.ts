/**
 * FR-035 — Garde-fous de la migration 0113 (checklists par pièce).
 *
 * L'application réelle (colonnes, contraintes, RLS, policy, droits) est
 * vérifiée par `npm run db:test-migrations` sur une base jetable. Ce test
 * statique verrouille le SQL : pièce portée par chaque ligne cochée,
 * référentiel borné par logement, isolé par tenant.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../drizzle/0113_checklists_pieces.sql", import.meta.url),
  "utf8",
);

describe("Checklists par pièce FR-035 : migration 0113", () => {
  it("ajoute la pièce aux lignes de checklist de façon idempotente", () => {
    expect(migration).toContain(
      'ALTER TABLE "menage_taches"\n  ADD COLUMN IF NOT EXISTS "piece" text NOT NULL DEFAULT \'\'',
    );
    expect(migration).toContain('"menage_taches_piece_check"');
  });

  it("crée le référentiel par logement", () => {
    expect(migration).toContain(
      'CREATE TABLE IF NOT EXISTS "menage_referentiels"',
    );
    expect(migration).toContain(
      '"logement_id" uuid NOT NULL REFERENCES "logements"("id") ON DELETE CASCADE',
    );
    expect(migration).toContain('"menage_referentiels_piece_check"');
    expect(migration).toContain('"menage_referentiels_libelle_check"');
    expect(migration).toContain('"menage_referentiels_ordres_check"');
  });

  it("borne un logement à quinze pièces de vingt tâches", () => {
    expect(migration).toContain('"piece_ordre" >= 0 AND "piece_ordre" < 15');
    expect(migration).toContain('"ordre" >= 0 AND "ordre" < 20');
  });

  it("interdit deux fois la même tâche dans une pièce d'un logement", () => {
    expect(migration).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS "menage_referentiels_tenant_logement_piece_libelle_uq"',
    );
    expect(migration).toContain(
      'ON "menage_referentiels" ("tenant_id", "logement_id", "piece", "libelle")',
    );
  });

  it("protège le référentiel par RLS et l'ouvre au seul tenant courant", () => {
    expect(migration).toContain(
      'ALTER TABLE "menage_referentiels" ENABLE ROW LEVEL SECURITY',
    );
    expect(migration).toContain("CREATE POLICY menage_referentiels_isolation");
    expect(
      migration.match(/current_setting\('app\.tenant_id', true\)/g),
    ).toHaveLength(2);
    expect(migration).toContain(
      'GRANT SELECT, INSERT, DELETE ON "menage_referentiels" TO lcd_app',
    );
  });

  it("indexe la lecture du référentiel par logement", () => {
    expect(migration).toContain(
      'CREATE INDEX IF NOT EXISTS "menage_referentiels_tenant_logement_idx"',
    );
    expect(migration).toContain('"piece_ordre", "ordre"');
  });
});
