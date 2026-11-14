/**
 * Le tunnel e2e doit choisir ses candidats dans le **sélecteur de logement**
 * (`/reserver?tenant=lcd`, 64 logements publiés) et non sur l'accueil (trois
 * cartes, dont des fixtures « Onboarding » sans tarif) : c'est ce qui rendait
 * les six tentatives systématiquement infructueuses (friction R-11).
 */
import { readFile, writeFile } from "node:fs/promises";

const fichier = "e2e/support/reservation-demo.ts";
let texte = await readFile(fichier, "utf8");

const avant = `  await page.goto("/");
  const cartes = page.locator(\`a[href*="/reserver?tenant=\${SLUG}&logement="]\`);
  await expect(cartes.first()).toBeVisible();

  const liens: string[] = [];
  for (let i = 0; i < (await cartes.count()); i++) {
    const href = await cartes.nth(i).getAttribute("href");
    if (href) liens.push(href);
  }
  expect(liens.length, "le site public doit publier un logement").toBeGreaterThan(0);`;

const apres = `  // Les cartes de l'accueil ne montrent que trois logements, souvent des
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
  expect(liens.length, "le site public doit publier un logement").toBeGreaterThan(0);`;

const occurrences = texte.split(avant).length - 1;
if (occurrences !== 1) {
  console.error(`Ancre non unique (${occurrences}).`);
  process.exit(1);
}
await writeFile(fichier, texte.replace(avant, apres), "utf8");
console.log("Candidats du tunnel pris dans le sélecteur de logement.");