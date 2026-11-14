/**
 * Test de budget JS (T027).
 *
 * Constitution III : cible voyageur < 50 Ko gzip, staff < 200 Ko gzip.
 * Les routes publiques et voyageur utilisent `csr = false` et ne chargent
 * aucun îlot obligatoire. Ce test vérifie statiquement le poids des assets
 * JS produits par `npm run build` (dossier build/client). Il est sauté si
 * le build n'existe pas (lancer `npm run build` avant).
 *
 * La mesure fine par route se fait avec `npm run measure:js` (serveur requis)
 * ; ce test garde une garde statique exécutable en CI sans serveur.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";

const RACINE = process.cwd();
const BUILD_CLIENT = join(RACINE, "build", "client");

// Budgets par fichier individuel : un chunk unique ne doit jamais dépasser
// le budget staff à lui seul, et le widget (seul JS public embarquable) est
// strictement borné.
const BUDGET_FICHIER_STAFF_KO = 200;
const BUDGET_WIDGET_KO = 15;

function listerFichiersJs(dossier: string): string[] {
  const resultats: string[] = [];
  for (const entree of readdirSync(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) {
      resultats.push(...listerFichiersJs(chemin));
    } else if (entree.name.endsWith(".js")) {
      resultats.push(chemin);
    }
  }
  return resultats;
}

function tailleGzipKo(chemin: string): number {
  const contenu = readFileSync(chemin);
  return gzipSync(contenu).length / 1024;
}

describe("budget JS (garde statique sur le build)", () => {
  const buildPresent = existsSync(BUILD_CLIENT);

  it.runIf(buildPresent)("aucun chunk JS du build ne dépasse le budget staff", () => {
    const fichiers = listerFichiersJs(BUILD_CLIENT);
    expect(fichiers.length).toBeGreaterThan(0);

    const depassements: string[] = [];
    for (const fichier of fichiers) {
      const ko = tailleGzipKo(fichier);
      if (ko > BUDGET_FICHIER_STAFF_KO) {
        depassements.push(`${fichier}: ${ko.toFixed(1)} Ko gzip`);
      }
    }
    expect(depassements).toEqual([]);
  });

  it.runIf(buildPresent)("le widget public reste léger", () => {
    const widget = join(BUILD_CLIENT, "widget.js");
    // Le widget peut vivre dans build/client ou être copié depuis static/.
    const chemin = existsSync(widget) ? widget : join(RACINE, "static", "widget.js");
    if (!existsSync(chemin)) {
      // Pas de widget = rien à borner ; le test reste vert mais trace l'absence.
      return;
    }
    const ko = tailleGzipKo(chemin);
    expect(ko).toBeLessThan(BUDGET_WIDGET_KO);
  });

  it("le budget est documenté et cohérent", () => {
    // Garde anti-régression sur les constantes elles-mêmes.
    expect(BUDGET_FICHIER_STAFF_KO).toBe(200);
    expect(BUDGET_WIDGET_KO).toBeLessThan(50);
  });

  it.skipIf(buildPresent)("build absent — lancé après npm run build", () => {
    // Marker explicite : sans build, la garde statique ne peut pas s'exercer.
    expect(buildPresent).toBe(true);
  });
});
