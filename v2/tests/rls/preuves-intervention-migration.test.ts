/**
 * FR-032 — Garde-fous de la migration 0112 (cycle de preuve d'intervention).
 *
 * L'application réelle (colonnes, contraintes, RLS, policy, droits) est
 * vérifiée par `npm run db:test-migrations` sur une base jetable. Ce test
 * statique verrouille le SQL : état borné aux quatre statuts, motif de refus
 * obligatoire et long, validation tracée, historique append-only protégé par
 * RLS et borné au tenant.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../drizzle/0112_preuves_intervention.sql", import.meta.url),
  "utf8",
);

describe("Preuve d'intervention FR-032 : migration 0112", () => {
  it("ajoute les cinq colonnes de preuve de façon idempotente", () => {
    for (const colonne of [
      "preuve_statut",
      "preuve_motif_refus",
      "preuve_soumise_le",
      "preuve_validee_le",
      "preuve_validee_par",
    ]) {
      expect(migration).toContain(`ADD COLUMN IF NOT EXISTS "${colonne}"`);
    }
  });

  it("borne le statut aux quatre états du cycle", () => {
    expect(migration).toContain('"missions_preuve_statut_check"');
    expect(migration).toContain(
      "'a_soumettre', 'soumise', 'validee', 'refusee'",
    );
  });

  it("n'accepte aucune preuve validée ou refusée sans soumission", () => {
    expect(migration).toContain('"missions_preuve_soumission_check"');
    expect(migration).toContain(
      `"preuve_statut" = 'a_soumettre' OR "preuve_soumise_le" IS NOT NULL`,
    );
  });

  it("exige un motif de refus d'au moins dix caractères", () => {
    expect(migration).toContain('"missions_preuve_refus_check"');
    expect(migration).toContain(
      `"preuve_statut" <> 'refusee'`,
    );
    expect(migration).toContain(`length("preuve_motif_refus") >= 10`);
  });

  it("exige validateur et date sur une preuve validée", () => {
    expect(migration).toContain('"missions_preuve_validation_check"');
    expect(migration).toContain(
      `"preuve_validee_le" IS NOT NULL AND "preuve_validee_par" IS NOT NULL`,
    );
  });

  it("crée l'historique des transitions, borné aux trois passages", () => {
    expect(migration).toContain(
      'CREATE TABLE IF NOT EXISTS "preuves_intervention_transitions"',
    );
    expect(migration).toContain(`"vers" IN ('soumise', 'validee', 'refusee')`);
    expect(migration).toContain('"preuves_transitions_motif_check"');
    expect(migration).toContain(
      `"vers" <> 'refusee'`,
    );
  });

  it("protège l'historique par RLS et l'ouvre au seul tenant courant", () => {
    expect(migration).toContain(
      'ALTER TABLE "preuves_intervention_transitions" ENABLE ROW LEVEL SECURITY',
    );
    expect(migration).toContain(
      "CREATE POLICY preuves_transitions_isolation",
    );
    expect(
      migration.match(/current_setting\('app\.tenant_id', true\)/g),
    ).toHaveLength(2);
    expect(migration).toContain(
      'GRANT SELECT, INSERT, DELETE ON "preuves_intervention_transitions" TO lcd_app',
    );
    // Aucun droit de mise à jour : l'historique ne se réécrit pas.
    expect(migration).not.toMatch(/UPDATE ON "preuves_intervention_transitions"/);
  });

  it("indexe le statut de preuve et l'historique par mission", () => {
    expect(migration).toContain(
      'CREATE INDEX IF NOT EXISTS "missions_preuve_statut_idx"',
    );
    expect(migration).toContain(
      'CREATE INDEX IF NOT EXISTS "preuves_transitions_mission_idx"',
    );
  });
});
