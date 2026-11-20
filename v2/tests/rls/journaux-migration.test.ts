/**
 * Garde-fous statiques des journaux applicatifs (FR-016) : sans eux, la table
 * pourrait redevenir non bornée (aucune purge), la purge pourrait descendre
 * sous un plancher raisonnable, le rôle applicatif pourrait acquérir le droit
 * de supprimer directement (contournant la purge SECURITY DEFINER), ou le
 * branchement dans le serveur pourrait disparaître en silence — la page de
 * supervision afficherait alors une table vide sans que rien ne le signale.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lire = (chemin: string): string =>
  readFileSync(new URL(`../../${chemin}`, import.meta.url), "utf8");

const migration = lire("drizzle/0109_journaux_applicatifs.sql");
const moduleJournaux = lire("src/lib/server/journaux.ts");
const logger = lire("src/lib/logger.ts");
const hooks = lire("src/hooks.server.ts");
const moduleRetention = lire("src/lib/server/retention.ts");
const pageSupervision = lire("src/routes/supervision/journaux/+page.server.ts");

const journal = JSON.parse(lire("drizzle/meta/_journal.json")) as {
  entries: { idx: number; tag: string; when: number }[];
};

describe("migration 0109 : journaux applicatifs (FR-016)", () => {
  it("crée la table plateforme avec niveau borné et contexte objet", () => {
    expect(migration).toContain(
      'CREATE TABLE IF NOT EXISTS "journaux_applicatifs"',
    );
    expect(migration).toContain(
      `CHECK ("niveau" IN ('info', 'error'))`,
    );
    expect(migration).toContain(`CHECK (jsonb_typeof("contexte") = 'object')`);
    // Table plateforme : aucun tenant_id (un incident est global). La table
    // créée ne doit pas porter la colonne ; un commentaire peut en parler.
    const definition = migration.slice(
      migration.indexOf('CREATE TABLE IF NOT EXISTS "journaux_applicatifs"'),
      migration.indexOf("ALTER TABLE \"journaux_applicatifs\""),
    );
    expect(definition).not.toContain("tenant_id");
  });

  it("indexe la lecture par date et par niveau", () => {
    expect(migration).toContain(
      'CREATE INDEX IF NOT EXISTS "journaux_applicatifs_created_at_idx"',
    );
    expect(migration).toContain(
      'CREATE INDEX IF NOT EXISTS "journaux_applicatifs_niveau_idx"',
    );
  });

  it("donne au rôle applicatif la lecture et l'insertion, pas la suppression", () => {
    expect(migration).toContain(
      'GRANT SELECT, INSERT ON "journaux_applicatifs" TO lcd_app',
    );
    // La suppression passe exclusivement par la purge SECURITY DEFINER.
    expect(migration).not.toContain(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON "journaux_applicatifs"',
    );
  });

  it("déclare une purge bornée avec un plancher de 7 jours", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION purger_journaux_applicatifs(p_retention_jours integer)",
    );
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("greatest(p_retention_jours, 7)");
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION purger_journaux_applicatifs(integer) FROM public",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION purger_journaux_applicatifs(integer) TO lcd_app",
    );
  });

  it("est déclarée dans le journal des migrations, à la suite de 0108", () => {
    const idx = journal.entries.findIndex(
      (entree) => entree.tag === "0109_journaux_applicatifs",
    );
    expect(idx).toBeGreaterThan(0);
    expect(journal.entries[idx]?.idx).toBe(109);
    expect(journal.entries[idx - 1]?.tag).toBe("0108_retention_bornee");
    // Horodatage strictement croissant : drizzle ordonne sur ce champ.
    expect(journal.entries[idx]?.when).toBeGreaterThan(
      journal.entries[idx - 1]?.when ?? 0,
    );
  });
});

describe("branchement de la persistance (FR-016)", () => {
  it("le serveur branche la persistance avant les planificateurs", () => {
    expect(hooks).toContain("brancherPersistanceJournaux()");
    // Les lignes de démarrage des planificateurs doivent déjà être
    // persistées : le branchement précède leur démarrage.
    const positionBranchement = hooks.indexOf("brancherPersistanceJournaux()");
    const positionPlanificateur = hooks.indexOf("demarrerPlanificateurIcs()");
    expect(positionBranchement).toBeGreaterThan(-1);
    expect(positionPlanificateur).toBeGreaterThan(positionBranchement);
  });

  it("le logger persiste sans jamais bloquer ni boucler", () => {
    expect(logger).toContain("configurerPersistanceJournal");
    // Jamais d'await sur la persistance dans le logger : fire-and-forget.
    expect(logger).not.toContain("await persistance");
    // Le module de persistance branche le logger mais n'écrit jamais avec :
    // journaliser la persistance serait récursif (une ligne par ligne).
    expect(moduleJournaux).not.toContain("logInfo(");
    expect(moduleJournaux).not.toContain("logErreur(");
    expect(moduleJournaux).toContain("configurerPersistanceJournal");
  });

  it("le masquage des clés sensibles est partagé avec Sentry", () => {
    expect(moduleJournaux).toContain("assainirContexte");
  });

  it("la rétention purge aussi les journaux applicatifs", () => {
    expect(moduleRetention).toContain(
      "select purger_journaux_applicatifs(",
    );
    expect(moduleRetention).toContain("journauxApplicatifs");
  });

  it("la page de supervision est réservée au super-admin", () => {
    expect(pageSupervision).toContain("requireSuperAdmin(event)");
    expect(pageSupervision).toContain("listerJournaux");
  });
});
