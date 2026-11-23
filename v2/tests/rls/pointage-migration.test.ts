/**
 * FR-031 — Garde-fous de la migration 0111 (pointage des missions).
 *
 * L'application réelle (colonnes, contraintes, index) est vérifiée par
 * `npm run db:test-migrations` sur une base jetable. Ce test statique
 * verrouille le SQL : colonnes idempotentes, bornes de durée prévue,
 * sources bornées à serveur/hors_ligne, ordre fin >= début, index partiel.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../drizzle/0111_missions_pointage.sql", import.meta.url),
  "utf8",
);

describe("Pointage FR-031 : migration 0111", () => {
  it("ajoute les sept colonnes de pointage de façon idempotente", () => {
    for (const colonne of [
      "duree_prevue_minutes",
      "debut_reel",
      "fin_reelle",
      "debut_reel_source",
      "fin_reelle_source",
      "debut_reel_recu_le",
      "fin_reelle_recu_le",
    ]) {
      expect(migration).toContain(`ADD COLUMN IF NOT EXISTS "${colonne}"`);
    }
  });

  it("borne la durée prévue à 1..1440 minutes", () => {
    expect(migration).toContain('ADD CONSTRAINT "missions_duree_prevue_check"');
    expect(migration).toContain('"duree_prevue_minutes" > 0');
    expect(migration).toContain('"duree_prevue_minutes" <= 1440');
  });

  it("n’accepte que les sources serveur et hors_ligne", () => {
    expect(migration).toContain('"missions_pointage_source_check"');
    // Une borne par source : début et fin.
    expect(migration.match(/IN \('serveur', 'hors_ligne'\)/g)).toHaveLength(2);
  });

  it("impose fin >= début dès que les deux sont posés", () => {
    expect(migration).toContain('"missions_pointage_ordre_check"');
    expect(migration).toContain('"fin_reelle" >= "debut_reel"');
  });

  it("garde les contraintes rejouables (garde pg_constraint)", () => {
    expect(migration.match(/IF NOT EXISTS \(\s*SELECT 1 FROM pg_constraint/g)).toHaveLength(3);
  });

  it("crée l’index partiel des pointages par prestataire", () => {
    expect(migration).toContain('CREATE INDEX IF NOT EXISTS "missions_pointage_idx"');
    expect(migration).toContain(
      '("tenant_id", "assigned_user_id", "debut_reel")',
    );
    expect(migration).toContain('WHERE "debut_reel" IS NOT NULL');
  });
});
