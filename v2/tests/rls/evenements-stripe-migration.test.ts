/**
 * Garde-fous statiques de la migration 0107 (FR-024) : sans ces éléments, la
 * trace des événements Stripe ne serait ni idempotente ni rejouable.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../drizzle/0107_evenements_stripe.sql", import.meta.url),
  "utf8",
);

const journal = JSON.parse(
  readFileSync(
    new URL("../../drizzle/meta/_journal.json", import.meta.url),
    "utf8",
  ),
) as { entries: { idx: number; tag: string }[] };

describe("migration 0107 : événements Stripe (FR-024)", () => {
  it("crée la table avec une clé d'idempotence unique par événement", () => {
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS "evenements_stripe"');
    expect(migration).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS "evenements_stripe_evenement_id_uq"',
    );
    expect(migration).toContain('"evenement_id" text NOT NULL');
  });

  it("borne les statuts et le type jsonb de l'événement", () => {
    expect(migration).toContain(
      `CHECK ("statut" IN ('recu','traite','ignore','echec'))`,
    );
    expect(migration).toContain(
      `CHECK (jsonb_typeof("evenement") = 'object')`,
    );
  });

  it("donne les droits au rôle applicatif (webhook)", () => {
    expect(migration).toContain(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON "evenements_stripe" TO lcd_app',
    );
  });

  it("purge par fonction bornée, sans jamais supprimer un échec", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION purger_evenements_stripe(p_retention_jours integer)",
    );
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("AND statut <> 'echec'");
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION purger_evenements_stripe(integer) FROM public",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION purger_evenements_stripe(integer) TO lcd_app",
    );
  });

  it("est déclarée dans le journal des migrations, à la suite de 0106", () => {
    const derniere = journal.entries.at(-1);
    expect(derniere?.tag).toBe("0107_evenements_stripe");
    expect(derniere?.idx).toBe(106 + 1);
  });
});
