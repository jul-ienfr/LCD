/**
 * Non-régression FR-016 — dates de la santé des tâches.
 *
 * Incident réel : `santeDesTaches` échouait (`derniere.debut.getTime is not a
 * function`) dès qu'une tâche avait tourné. `db.execute` rend les timestamps
 * en chaîne ; seul le query builder les convertit en `Date`. Le contrôle
 * d'absence (FR-002/FR-003) était donc muet en production. Cette garde
 * empêche le retour au SQL brut sur ce chemin.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lire = (chemin: string): string =>
  readFileSync(new URL(`../../../${chemin}`, import.meta.url), "utf8");

const module = lire("src/lib/server/journal-execution.ts");

describe("lecture de la santé des tâches (FR-016/FR-002)", () => {
  it("lit la dernière exécution par le query builder (dates en Date)", () => {
    // La fonction qui alimente `evaluerTache` doit utiliser le builder :
    // le SQL brut rendrait `debut` en chaîne et `getTime()` jetterait.
    const debut = module.indexOf("async function derniereExecutionParTache");
    const fin = module.indexOf("\n}", debut);
    expect(debut).toBeGreaterThan(-1);
    const corps = module
      .slice(debut, fin)
      .split("\n")
      .filter((ligne) => !ligne.trim().startsWith("//"))
      .join("\n");
    expect(corps).toContain("selectDistinctOn");
    expect(corps).not.toContain("db.execute");
  });

  it("conserve getTime() sur la date de dernière exécution", () => {
    // Le calcul d'âge reste la preuve que la valeur est bien un Date.
    expect(module).toContain("derniere.debut.getTime()");
  });
});
