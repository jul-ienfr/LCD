import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const email = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const motDePasse = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
});
const page = await context.newPage();
const erreurs = [];
page.on("pageerror", (erreur) => erreurs.push(`pageerror: ${erreur.message}`));
page.on("console", (message) => {
  if (message.type() === "error") erreurs.push(`console: ${message.text()}`);
});

await page.goto(`${base}/login`, { waitUntil: "load" });
await page.fill('input[name="email"]', email);
await page.fill('input[name="password"]', motDePasse);
await page.click('button[type="submit"]');
await page.waitForURL(/\/hote/, { timeout: 20000 });

const routes = [
  "/hote",
  "/hote/planning",
  "/hote/logements",
  "/hote/messages/fils",
  "/hote/utilisateurs",
];
const rapport = [];
for (const route of routes) {
  const reponse = await page.goto(`${base}${route}`, {
    waitUntil: "load",
    timeout: 30000,
  });
  await page.waitForTimeout(200);
  const info = await page.evaluate(() => {
    const courant = document.querySelectorAll('[aria-current="page"]');
    return {
      titre: document.querySelector("h1")?.textContent?.trim() ?? null,
      ariane: document.querySelector("nav[aria-label] ol")?.textContent?.trim() ?? null,
      arianeLiens: document.querySelectorAll("nav[aria-label='Fil d\\'Ariane'] a").length,
      courants: courant.length,
      courantsHref: [...courant].map((n) => n.getAttribute("href")),
      navPrincipale: document.querySelectorAll("header nav ul > li").length,
      recherche: Boolean(document.querySelector("form[role='search']")),
      debordement: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  rapport.push({ route, statut: reponse?.status() ?? null, ...info });
}
console.log(JSON.stringify({ rapport, erreurs }, null, 2));
await browser.close();
