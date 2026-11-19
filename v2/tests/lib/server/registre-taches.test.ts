import { describe, expect, it } from "vitest";
import {
  RETENTION_EXECUTIONS_JOURS,
  TACHES_PLANIFIEES,
  tacheParNom,
} from "@/lib/server/registre-taches";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("référentiel des tâches planifiées (006 FR-001)", () => {
  it("déclare les quinze tâches suivies, noms uniques", () => {
    const noms = TACHES_PLANIFIEES.map((tache) => tache.nom);
    expect(new Set(noms).size).toBe(noms.length);
    expect(noms).toContain("purge-police");
    expect(noms).toContain("memoire");
    expect(noms).toContain("relances");
    expect(noms).toContain("relances-sejour");
    expect(noms).toContain("releves");
    expect(noms).toContain("messages-auto");
    expect(noms).toContain("pricing");
    expect(noms).toContain("reconcile-fournisseurs");
    expect(noms).toContain("sauvegarde");
    expect(noms).toContain("restauration-controle");
    expect(noms).toContain("verifier-taches");
    expect(TACHES_PLANIFIEES.length).toBe(15);
  });

  it("chaque route déclarée existe réellement dans src/routes/api/cron", () => {
    for (const tache of TACHES_PLANIFIEES) {
      if (!tache.route) continue;
      const chemin = join(
        "src",
        "routes",
        ...tache.route.replace(/^\//, "").split("/"),
        "+server.ts",
      );
      expect(existsSync(chemin), `${tache.route} attendu`).toBe(true);
    }
  });

  it("chaque route de cron du dépôt est déclarée dans le référentiel", () => {
    const routesDeclarees = new Set(
      TACHES_PLANIFIEES.map((tache) => tache.route).filter(Boolean),
    );
    const routesConnues = [
      "/api/cron/sync-ota",
      "/api/cron/sync-fournisseurs",
      "/api/cron/sante-fournisseurs",
      "/api/cron/webhooks",
      "/api/cron/reconcile-fournisseurs",
      "/api/cron/purge-police",
      "/api/cron/memoire",
      "/api/cron/pricing",
      "/api/cron/messages-auto",
      "/api/cron/relances",
      "/api/cron/relances-sejour",
      "/api/cron/releves",
      "/api/cron/verifier-taches",
    ];
    for (const route of routesConnues) {
      expect(routesDeclarees.has(route), `${route} non déclarée`).toBe(true);
    }
  });

  it("cadences strictement positives et runbook renseigné", () => {
    for (const tache of TACHES_PLANIFIEES) {
      expect(tache.cadenceMinutes).toBeGreaterThan(0);
      expect(tache.runbook.length).toBeGreaterThan(0);
      expect(tache.libelle.length).toBeGreaterThan(0);
    }
  });

  it("tacheParNom retrouve une tâche et rejette l'inconnue", () => {
    expect(tacheParNom("purge-police")?.libelle).toContain("police");
    expect(tacheParNom("inconnue")).toBeNull();
  });

  it("la rétention du journal est bornée", () => {
    expect(RETENTION_EXECUTIONS_JOURS).toBe(90);
  });
});
