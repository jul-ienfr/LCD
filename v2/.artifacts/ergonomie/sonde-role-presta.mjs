/**
 * Sonde de recette : un rôle hors espace hôte (prestataire) est renvoyé vers sa
 * propre surface et garde l'accès à sa sécurité personnelle.
 * Usage : node --env-file=.env.local .artifacts/ergonomie/sonde-role-presta.mjs
 */
import { chromium } from "playwright";

const base = process.env.SONDE_BASE ?? "http://127.0.0.1:4173";
const email = process.env.SEED_PRESTA_EMAIL;
const motDePasse = process.env.SEED_PRESTA_PASSWORD;
if (!email || !motDePasse) {
  console.error("SEED_PRESTA_EMAIL / SEED_PRESTA_PASSWORD absents");
  process.exit(1);
}

const navigateur = await chromium.launch();
const page = await navigateur.newPage();
await page.goto(`${base}/login`);
await page.fill('input[type="email"]', email);
await page.fill('input[type="password"]', motDePasse);
await page.getByRole("button", { name: "Se connecter" }).click();
await page.waitForURL(/\/presta$/);
console.log("connexion presta : ok →", page.url());

for (const chemin of ["/hote", "/hote/audit", "/hote/securite"]) {
  const reponse = await page.goto(`${base}${chemin}`);
  const titre = await page
    .locator("h1")
    .first()
    .textContent()
    .catch(() => null);
  console.log(
    `${chemin} → ${page.url()} (${reponse?.status()}) h1=${(titre ?? "").trim().slice(0, 40)}`,
  );
}
await navigateur.close();
