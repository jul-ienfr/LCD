/**
 * Garde-fous statiques de la rétention bornée (FR-015) : sans eux, une purge
 * pourrait redevenir non bornée, supprimer une file vivante (livraisons
 * webhook en attente, blocages de connexion actifs) ou échouer en silence
 * faute de câblage dans un déclencheur planifié.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lire = (chemin: string): string =>
  readFileSync(new URL(`../../${chemin}`, import.meta.url), "utf8");

const migration = lire("drizzle/0108_retention_bornee.sql");
const routeVerifierTaches = lire(
  "src/routes/api/cron/verifier-taches/+server.ts",
);
const planificateur = lire("src/lib/server/planificateur-exploitation.ts");
const moduleRetention = lire("src/lib/server/retention.ts");

const journal = JSON.parse(lire("drizzle/meta/_journal.json")) as {
  entries: { idx: number; tag: string; when: number }[];
};

const FONCTIONS = [
  "purger_audit_logs",
  "purger_evenements_canal",
  "purger_livraisons_webhook",
  "purger_executions_automatisation",
  "purger_tentatives_connexion",
];

describe("migration 0108 : rétention bornée (FR-015)", () => {
  it("déclare une fonction de purge bornée par famille", () => {
    for (const fonction of FONCTIONS) {
      expect(migration).toContain(
        `CREATE OR REPLACE FUNCTION ${fonction}(p_retention_jours integer)`,
      );
    }
    // Les tables visées sont sous RLS : chaque purge passe par SECURITY
    // DEFINER, et le filtre de rétention est un paramètre (jamais 0).
    const blocs = migration
      .split("CREATE OR REPLACE FUNCTION ")
      .slice(1);
    expect(blocs).toHaveLength(FONCTIONS.length);
    for (const bloc of blocs) {
      expect(bloc).toContain("SECURITY DEFINER");
      expect(bloc).toContain(
        "WHERE",
      );
    }
  });

  it("ne descend jamais sous 365 jours pour le journal d'audit", () => {
    expect(migration).toContain("greatest(p_retention_jours, 365)");
  });

  it("ne supprime jamais un événement canal en erreur", () => {
    expect(migration).toContain("AND statut <> 'erreur'");
  });

  it("ne supprime jamais une livraison webhook en attente", () => {
    expect(migration).toContain("AND statut <> 'pending'");
  });

  it("ne supprime jamais un blocage de connexion encore actif", () => {
    expect(migration).toContain(
      "AND (bloque_jusqua IS NULL OR bloque_jusqua < now())",
    );
  });

  it("réserve l'exécution au rôle applicatif", () => {
    for (const fonction of FONCTIONS) {
      expect(migration).toContain(
        `REVOKE ALL ON FUNCTION ${fonction}(integer) FROM public`,
      );
      expect(migration).toContain(
        `GRANT EXECUTE ON FUNCTION ${fonction}(integer) TO lcd_app`,
      );
    }
  });

  it("est déclarée dans le journal des migrations, à la suite de 0107", () => {
    const idx = journal.entries.findIndex(
      (entree) => entree.tag === "0108_retention_bornee",
    );
    expect(idx).toBeGreaterThan(0);
    expect(journal.entries[idx]?.idx).toBe(108);
    expect(journal.entries[idx - 1]?.tag).toBe("0107_evenements_stripe");
    // Horodatage strictement croissant : drizzle ordonne sur ce champ.
    expect(journal.entries[idx]?.when).toBeGreaterThan(
      journal.entries[idx - 1]?.when ?? 0,
    );
  });
});

describe("câblage des purges planifiées (FR-015)", () => {
  it("le module de rétention appelle les cinq fonctions SQL bornées", () => {
    for (const fonction of FONCTIONS) {
      expect(moduleRetention).toContain(`select ${fonction}(`);
    }
  });

  it("le contrôle des tâches (cron) purge à chaque passage", () => {
    expect(routeVerifierTaches).toContain("purgerRetentions");
    expect(routeVerifierTaches).toContain("retentionsPurgees");
  });

  it("le planificateur in-process purge aussi (un seul chemin survit)", () => {
    expect(planificateur).toContain("purgerRetentions");
  });
});
