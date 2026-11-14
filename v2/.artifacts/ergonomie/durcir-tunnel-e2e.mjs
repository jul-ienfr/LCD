/**
 * Rend le parcours e2e du tunnel de réservation robuste à la pollution du jeu
 * de démonstration.
 *
 * Constat (2026-11-13, friction R-11) : la base `lcd_demo` accumule les
 * logements créés par les exécutions e2e (617 logements, dont **64 publiés** —
 * 48 fixtures « E2E » et 16 logements de démonstration). Le tunnel tire un
 * logement publié au hasard ; la plupart des fixtures sont sans tarif sur la
 * fenêtre tirée, donc le prix ne s'affiche jamais et six tentatives ne
 * suffisent plus. Deux tests de réservation ont échoué en fin de journée pour
 * cette seule raison.
 *
 * Correctif : balayer davantage de candidats (borné) et abandonner une
 * tentative dès que le refus est affiché, au lieu d'attendre quatre secondes le
 * bloc de prix qui ne viendra pas.
 */
import { readFile, writeFile } from "node:fs/promises";

const fichier = "e2e/support/reservation-demo.ts";
let texte = await readFile(fichier, "utf8");

const remplacements = [
  // 1. Helper d'attente « prix ou refus ».
  [
    `async function visible(cible: Locator, delai = 5000): Promise<boolean> {`,
    `/**
 * Attend le bloc de prix, mais rend la main immédiatement si la page affiche un
 * refus (règles de l'hôte, dates prises, séjour indisponible) : sans cela
 * chaque candidat inutilisable coûte le délai complet.
 */
async function prixOuRefus(page: Page, delai = 4000): Promise<boolean> {
  const prix = page.locator("[data-resume-prix]");
  const refus = page
    .locator('[role="alert"]')
    .filter({
      hasText:
        /règles de l'hôte|choisissez d'autres dates|déjà (pris|réservé)|indisponible/i,
    });
  const gagnant = await Promise.race([
    prix
      .waitFor({ state: "visible", timeout: delai })
      .then(() => "prix" as const)
      .catch(() => null),
    refus
      .first()
      .waitFor({ state: "visible", timeout: delai })
      .then(() => "refus" as const)
      .catch(() => null),
  ]);
  return gagnant === "prix";
}

async function visible(cible: Locator, delai = 5000): Promise<boolean> {`,
  ],
  // 2. Nombre de tentatives : un candidat par logement publié, borné.
  [
    `  const graine = Math.floor(Math.random() * 1_000_000);
  const ordre = [...liens].sort(() => Math.random() - 0.5);
  for (let tentative = 0; tentative < 6; tentative++) {`,
    `  const graine = Math.floor(Math.random() * 1_000_000);
  const ordre = [...liens].sort(() => Math.random() - 0.5);
  const maxTentatives = Math.min(Math.max(6, ordre.length), 12);
  for (let tentative = 0; tentative < maxTentatives; tentative++) {`,
  ],
  // 3. Utiliser le nouveau helper à la place de l'attente aveugle.
  [
    `    if (!(await visible(page.locator("[data-resume-prix]"), 4000))) continue;`,
    `    if (!(await prixOuRefus(page))) continue;`,
  ],
  // 4. Message d'échec exact.
  [
    `  throw new Error(
    "le tunnel de réservation n'a abouti sur aucune des six tentatives " +
      "(tous les créneaux tirés étaient déjà pris par une exécution précédente)",
  );`,
    `  throw new Error(
    \`le tunnel de réservation n'a abouti sur aucune des \${maxTentatives} tentatives \` +
      "(logements publiés sans tarif sur la fenêtre tirée, règles de l'hôte, " +
      "ou créneaux déjà pris par une exécution précédente)",
  );`,
  ],
];

for (const [avant, apres] of remplacements) {
  const occurrences = texte.split(avant).length - 1;
  if (occurrences !== 1) {
    console.error(
      `Remplacement non unique (${occurrences}) : ${avant.slice(0, 70)}`,
    );
    process.exit(1);
  }
  texte = texte.replace(avant, apres);
}

await writeFile(fichier, texte, "utf8");
console.log("Parcours e2e du tunnel durci (12 candidats max, refus détecté tôt).");