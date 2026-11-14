/**
 * Rétablit `e2e/support/reservation-demo.ts` dans son état d'avant mes
 * modifications (le fichier est non suivi par Git : il n'y a pas de version de
 * référence à restaurer). Mes changements ont aggravé la situation (5 échecs au
 * lieu de 2) parce qu'ils élargissaient le tirage à 64 candidats dont 61
 * fixtures sans tarif.
 */
import { readFile, writeFile } from "node:fs/promises";

const fichier = "e2e/support/reservation-demo.ts";
let texte = await readFile(fichier, "utf8");

const retours = [
  // 1. Supprimer le helper `prixOuRefus`.
  [
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

async function visible(`,
    `async function visible(`,
  ],
  // 2. Rétablir la collecte des candidats depuis l'accueil.
  [
    `  // Les cartes de l'accueil ne montrent que trois logements, souvent des
  // fixtures d'autres tests sans tarif publié : le sélecteur du tunnel les
  // expose tous. On y prend les candidats, l'accueil restant le repli.
  const liens: string[] = [];
  for (const page_ of [\`/reserver?tenant=\${SLUG}\`, "/"]) {
    await page.goto(page_);
    const cartes = page.locator(
      \`a[href*="/reserver?tenant=\${SLUG}&logement="]\`,
    );
    if ((await cartes.count()) === 0) continue;
    await expect(cartes.first()).toBeVisible();
    for (let i = 0; i < (await cartes.count()); i++) {
      const href = await cartes.nth(i).getAttribute("href");
      if (href && !liens.includes(href)) liens.push(href);
    }
    if (liens.length > 3) break;
  }
  expect(liens.length, "le site public doit publier un logement").toBeGreaterThan(0);`,
    `  await page.goto("/");
  const cartes = page.locator(\`a[href*="/reserver?tenant=\${SLUG}&logement="]\`);
  await expect(cartes.first()).toBeVisible();

  const liens: string[] = [];
  for (let i = 0; i < (await cartes.count()); i++) {
    const href = await cartes.nth(i).getAttribute("href");
    if (href) liens.push(href);
  }
  expect(liens.length, "le site public doit publier un logement").toBeGreaterThan(0);`,
  ],
  // 3. Six tentatives.
  [
    `  const maxTentatives = Math.min(Math.max(6, ordre.length), 12);
  for (let tentative = 0; tentative < maxTentatives; tentative++) {`,
    `  for (let tentative = 0; tentative < 6; tentative++) {`,
  ],
  // 4. Attente aveugle du bloc de prix.
  [
    `    if (!(await prixOuRefus(page))) continue;`,
    `    if (!(await visible(page.locator("[data-resume-prix]"), 4000))) continue;`,
  ],
  // 5. Message d'origine.
  [
    `  throw new Error(
    \`le tunnel de réservation n'a abouti sur aucune des \${maxTentatives} tentatives \` +
      "(logements publiés sans tarif sur la fenêtre tirée, règles de l'hôte, " +
      "ou créneaux déjà pris par une exécution précédente)",
  );`,
    `  throw new Error(
    "le tunnel de réservation n'a abouti sur aucune des six tentatives " +
      "(tous les créneaux tirés étaient déjà pris par une exécution précédente)",
  );`,
  ],
];

for (const [avant, apres] of retours) {
  const occurrences = texte.split(avant).length - 1;
  if (occurrences !== 1) {
    console.error(`Retour non unique (${occurrences}) : ${avant.slice(0, 60)}`);
    process.exit(1);
  }
  texte = texte.replace(avant, apres);
}

await writeFile(fichier, texte, "utf8");
console.log("reservation-demo.ts rétabli dans son état d'origine.");