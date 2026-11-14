/**
 * Vérifie que les mesures d'ergonomie sont bien écrites en base (T090-T092).
 *
 * Parcours : consentement mesure → connexion super-admin → visite /hote puis
 * deux recherches (avec et sans résultat). Les événements sont ensuite lus
 * dans `suivi_evenements` par la commande psql appelante.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const EMAIL = process.env.CIBLES_EMAIL ?? "admin@lcd.test";
const MOT_DE_PASSE = process.env.CIBLES_MOT_DE_PASSE ?? "ChangeMe-2026!";

const navigateur = await chromium.launch();
const contexte = await navigateur.newContext({ viewport: { width: 390, height: 844 } });
await contexte.addCookies([
  { name: "lcd_consentement", value: "v1.m1.p0", url: BASE },
  { name: "lcd_langue", value: "fr", url: BASE },
]);
const page = await contexte.newPage();

await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[name="email"]', EMAIL);
await page.fill('input[name="password"]', MOT_DE_PASSE);
await page.click('button[type="submit"]');
await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30000 });
console.log(`connecte: ${page.url()}`);

await page.goto(`${BASE}/hote`, { waitUntil: "domcontentloaded" });
console.log(`hote: ${page.url()} (${page.url().includes("/hote") ? "ok" : "redirige"})`);

await page.goto(`${BASE}/hote/recherche?q=zzzintrouvablezzz`, { waitUntil: "domcontentloaded" });
console.log(`recherche sans resultat: ${page.url()}`);

await page.goto(`${BASE}/hote/recherche?q=resa-ergo`, { waitUntil: "domcontentloaded" });
console.log(`recherche avec resultat: ${page.url()}`);

await page.goto(`${BASE}/voyageur`, { waitUntil: "domcontentloaded" });
console.log(`voyageur sans token: ${page.url()}`);

// Séjour réel : lien signé publié par le planning hôte.
await page.goto(`${BASE}/hote/planning`, { waitUntil: "domcontentloaded" });
const lienVoyageur = await page
  .locator('a[href*="/voyageur?t="]')
  .first()
  .getAttribute("href")
  .catch(() => null);
if (!lienVoyageur) {
  console.log("voyageur signe: aucun lien publie sur /hote/planning");
} else {
  await page.goto(new URL(lienVoyageur, BASE).href, { waitUntil: "domcontentloaded" });
  const titre = await page.locator("h1").first().innerText().catch(() => "");
  console.log(`voyageur signe: h1="${titre.slice(0, 40)}"`);
}

await navigateur.close();
