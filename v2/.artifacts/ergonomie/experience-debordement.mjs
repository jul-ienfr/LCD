/**
 * Expérience : cherche ce qui fait grimper `documentElement.scrollWidth` sur
 * une page dont le tableau est pourtant dans un conteneur `overflow-x: auto`.
 *
 * Usage : node .artifacts/ergonomie/experience-debordement.mjs <base> <route>
 */
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:4173";
const route = process.argv[3] ?? "/hote/rgpd";
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

await page.goto(`${base}${route}`, { waitUntil: "load" });

const resultat = await page.evaluate(() => {
  const mesures = [];
  const lire = (etape) => {
    const html = document.documentElement;
    window.scrollTo(500, 0);
    const x = window.scrollX;
    window.scrollTo(0, 0);
    mesures.push({
      etape,
      html: html.scrollWidth,
      body: document.body.scrollWidth,
      defile: x,
    });
  };
  const table = document.querySelector("table");
  const enveloppe = table?.parentElement ?? null;
  lire("initial");
  if (enveloppe) {
    enveloppe.style.contain = "paint";
    lire("conteneur contain:paint");
    enveloppe.style.contain = "";
  }
  if (table) {
    table.style.minWidth = "0";
    table.style.maxWidth = "100%";
    lire("tableau min-width:0");
    table.style.minWidth = "";
    table.style.maxWidth = "";
  }
  if (enveloppe) {
    enveloppe.style.overflowY = "hidden";
    lire("conteneur overflow-y:hidden");
    enveloppe.style.overflowY = "";
  }
  return mesures;
});

for (const m of resultat) {
  console.log(
    `${m.etape.padEnd(26)} html=${m.html} body=${m.body} défilement=${m.defile}`,
  );
}

await navigateur.close();