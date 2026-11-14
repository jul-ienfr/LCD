/**
 * Contrôle d'une case à cocher : dimensions de l'étiquette associée, pour
 * comprendre pourquoi le contrat 44 px la refuse.
 *
 * Usage : node .artifacts/ergonomie/sonder-cases.mjs <base> <route> [route...]
 */
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:4173";
const cibles = process.argv.slice(3);
const email = process.env.AUDIT_EMAIL;
const motDePasse = process.env.AUDIT_MOT_DE_PASSE;

const navigateur = await chromium.launch({ headless: true });
const contexte = await navigateur.newContext({ viewport: { width: 320, height: 568 } });
const page = await contexte.newPage();

if (email && motDePasse) {
  await page.goto(`${base}/login`, { waitUntil: "load" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="motDePasse"]', motDePasse).catch(async () => {
    await page.fill('input[name="password"]', motDePasse);
  });
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
}

for (const route of cibles) {
  await page.goto(`${base}${route}`, { waitUntil: "load" });
  const r = await page.evaluate(() => {
    const lignes = [];
    for (const input of document.querySelectorAll('input[type="checkbox"], input[type="radio"]')) {
      const etiquette = input.closest("label");
      const rect = etiquette?.getBoundingClientRect();
      lignes.push({
        nom: input.getAttribute("name"),
        etiquette: etiquette ? Math.round(rect.width) + "x" + Math.round(rect.height) : "aucune",
        minH: etiquette ? getComputedStyle(etiquette).minHeight : "-",
      });
    }
    return lignes;
  });
  console.log(`=== ${route} (${r.length} cases)`);
  for (const l of r) {
    const etat = l.etiquette === "aucune" || /^(\d+)x(\d+)$/.test(l.etiquette) === false
      ? "?"
      : (() => {
          const [w, h] = l.etiquette.split("x").map(Number);
          return w >= 44 && h >= 44 ? "ok" : "SOUS SEUIL";
        })();
    console.log(`   ${l.nom} étiquette=${l.etiquette} min-height=${l.minH} ${etat}`);
  }
}

await navigateur.close();