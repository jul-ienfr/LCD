/**
 * FR-036 — Garde-fous de la migration 0114 (inventaire photo de référence).
 *
 * L'application réelle (colonnes, contraintes, RLS, policy, droits) est
 * vérifiée par `npm run db:test-migrations` sur une base jetable. Ce test
 * statique verrouille le SQL : pièce sur les photos de preuve, inventaire
 * borné et légendé par logement, isolé par tenant.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../drizzle/0114_inventaire_photos_reference.sql", import.meta.url),
  "utf8",
);

describe("Inventaire photo de référence FR-036 : migration 0114", () => {
  it("ajoute la pièce aux photos de preuve de façon idempotente", () => {
    expect(migration).toContain(
      'ALTER TABLE "photos_menage"\n  ADD COLUMN IF NOT EXISTS "piece" text NOT NULL DEFAULT \'\'',
    );
    expect(migration).toContain('"photos_menage_piece_check"');
  });

  it("crée l'inventaire de référence", () => {
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS "photos_reference"');
    expect(migration).toContain(
      '"logement_id" uuid NOT NULL REFERENCES "logements"("id") ON DELETE CASCADE',
    );
    expect(migration).toContain('"photos_reference_piece_check"');
    expect(migration).toContain('"photos_reference_legende_check"');
    expect(migration).toContain('"photos_reference_taille_check"');
  });

  it("borne la pièce, la légende et le poids", () => {
    expect(migration).toContain(
      'CHECK (length("piece") >= 1 AND length("piece") <= 60)',
    );
    expect(migration).toContain('CHECK (length("legende") <= 120)');
    expect(migration).toContain(
      'CHECK ("taille_octets" > 0 AND "taille_octets" <= 10485760)',
    );
  });

  it("indexe l'inventaire par pièce et protège chaque référence", () => {
    expect(migration).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS "photos_reference_tenant_ref_uq"',
    );
    expect(migration).toContain(
      'CREATE INDEX IF NOT EXISTS "photos_reference_tenant_logement_piece_idx"',
    );
    expect(migration).toContain(
      'ON "photos_reference" ("tenant_id", "logement_id", "piece", "created_at")',
    );
  });

  it("protège l'inventaire par RLS et l'ouvre au seul tenant courant", () => {
    expect(migration).toContain(
      'ALTER TABLE "photos_reference" ENABLE ROW LEVEL SECURITY',
    );
    expect(migration).toContain("CREATE POLICY photos_reference_isolation");
    expect(
      migration.match(/current_setting\('app\.tenant_id', true\)/g),
    ).toHaveLength(2);
    expect(migration).toContain(
      'GRANT SELECT, INSERT, DELETE ON "photos_reference" TO lcd_app',
    );
  });
});
