/**
 * Visite des routes staff avec une session super-admin et rapporte ce que le
 * serveur répond (statut + texte d'erreur éventuel).
 *
 * Usage : node .artifacts/ergonomie/verifier-staff.mjs <base> <route> [route...]
 */
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:4173";
const cibles = process.argv.slice(3);
const email = process.env.AUDIT_EMAIL ?? "super@lcd.test";
const motDePasse = process.env.AUDIT_MOT_DE_PASSE ?? "ChangeMe-2026!";

const navigateur = await chromium.launch({ headless: true });
const contexte = await navigateur.newContext({ viewport: { width: 320, height: 568 } });
const page = await contexte.newPage();

await page.goto(`${base}/login`, { waitUntil: "load" });
await page.fill('input[name="email"]', email);
await page.fill('input[name="motDePasse"]', motDePasse).catch(async () => {
  await page.fill('input[name="password"]', motDePasse);
});
await Promise.all([
  page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20000 }),
  page.click('button[type="submit"]'),
]);
console.log(`session ouverte : ${page.url()}`);

for (const route of cibles) {
  const reponse = await page.goto(`${base}${route}`, { waitUntil: "load" });
  const statut = reponse?.status() ?? 0;
  const texte = (await page.textContent("body")) ?? "";
  const propre = texte.replace(/\s+/g, " ").trim();
  console.log(`${route} -> ${statut} | ${propre.slice(0, 220)}`);
}

await navigateur.close();