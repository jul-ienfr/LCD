/**
 * Vérifie qu'un visiteur qui a accepté la mesure ne voit plus son chargement
 * retardé par un script tiers injoignable.
 *
 * Contexte (2026-11-13) : avec le cookie de consentement, la page injectait
 * `https://plausible.io/js/script.js`. Le tag était d'abord en `defer` (page
 * figée en `readyState=interactive`), puis en `async` (page `load` bloquée
 * jusqu'au timeout réseau). Les tiers sont désormais injectés *après* `load`
 * par un script inline.
 *
 * Usage : node .artifacts/ergonomie/verifier-chargement-tiers.mjs [base]
 * Sortie : une ligne par route, `load` mesuré en millisecondes.
 */
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:4173";
const routes = process.argv.slice(3);
const cibles = routes.length > 0 ? routes : ["/reserver", "/voyageur", "/"];

const navigateur = await chromium.launch({ headless: true });
const contexte = await navigateur.newContext({
  viewport: { width: 412, height: 915 },
  locale: "fr-FR",
});
await contexte.addCookies([
  { name: "lcd_langue", value: "fr", url: base },
  { name: "lcd_consentement", value: "v1.m1.p0", url: base },
]);
const page = await contexte.newPage();

let echecs = 0;
for (const route of cibles) {
  const debut = Date.now();
  try {
    await page.goto(`${base}${route}`, { waitUntil: "load", timeout: 20000 });
    const ms = Date.now() - debut;
    const etat = await page.evaluate(() => document.readyState);
    const tiers = await page.evaluate(() =>
      [...document.querySelectorAll("script[src]")]
        .map((s) => s.getAttribute("src") ?? "")
        .filter((src) => /^https?:\/\//.test(src)),
    );
    console.log(
      `${route} : load en ${ms} ms, readyState=${etat}, tiers injectés=${tiers.length} ${JSON.stringify(tiers)}`,
    );
    if (ms > 10000) {
      console.log(`  ↳ ÉCHEC : le chargement a attendu ${ms} ms`);
      echecs += 1;
    }
    // Toutes les pages ne mesurent pas (pas de domaine configuré, pas de tenant
    // résolu) : on n'exige l'injection que si le HTML porte le chargeur.
    const chargeurAttendu = await page.evaluate(
      () => document.documentElement.innerHTML.includes("plausible.io/js/script.js"),
    );
    const plausible = tiers.filter((src) => src.includes("plausible.io"));
    if (chargeurAttendu && plausible.length !== 1) {
      console.log("  ↳ ÉCHEC : le script Plausible n'est pas injecté une seule fois");
      echecs += 1;
    }
  } catch (erreur) {
    console.log(`${route} : ÉCHEC (${String(erreur).split("\n")[0]})`);
    echecs += 1;
  }
}

await navigateur.close();
console.log(echecs === 0 ? "OK : aucun tiers ne retarde le chargement." : `${echecs} échec(s).`);
process.exit(echecs === 0 ? 0 : 1);