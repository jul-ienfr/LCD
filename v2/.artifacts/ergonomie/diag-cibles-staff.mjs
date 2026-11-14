import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const route = process.argv[2] ?? "/hote/messages";
const seuil = 44;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 320, height: 568 },
});
const page = await context.newPage();
await page.goto(`${base}/login`, { waitUntil: "load" });
await page.fill('input[name="email"]', process.env.CIBLES_EMAIL ?? "admin@lcd.test");
await page.fill('input[name="password"]', process.env.CIBLES_MOT_DE_PASSE ?? "ChangeMe-2026!");
await page.click('button[type="submit"]');
await page.waitForURL(/\/hote/, { timeout: 30000 });
await page.goto(`${base}${route}`, { waitUntil: "load" });
await page.waitForTimeout(300);

const info = await page.evaluate((seuil) => {
  const inline = "p a, li a, label a, figcaption a";
  const groupes = new Map();
  for (const element of document.querySelectorAll("a, button, summary, input, select, textarea")) {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.width >= seuil && rect.height >= seuil) continue;
    const nav = element.closest("nav")?.getAttribute("aria-label") ?? "-";
    const parent = element.parentElement;
    const cle = [
      element.tagName.toLowerCase() + (element.getAttribute("type") ? `[${element.getAttribute("type")}]` : ""),
      `h=${Math.round(rect.height)}`,
      `nav=${nav}`,
      `inline=${element.matches(inline)}`,
      `parent=${parent?.tagName.toLowerCase()}.${(parent?.getAttribute("class") ?? "").split(" ").slice(0, 3).join(".")}`,
    ].join(" | ");
    const existant = groupes.get(cle) ?? { cle, count: 0, exemples: [] };
    existant.count += 1;
    if (existant.exemples.length < 3) existant.exemples.push((element.textContent ?? "").trim().slice(0, 30));
    groupes.set(cle, existant);
  }
  return [...groupes.values()].sort((a, b) => b.count - a.count);
}, seuil);

for (const groupe of info) {
  console.log(`${groupe.count} x ${groupe.cle} -> ${groupe.exemples.join(" / ")}`);
}
const debordement = await page.evaluate(() => {
  const largeur = document.documentElement.clientWidth;
  const resultat = [];
  const coupe = (element) => {
    let noeud = element.parentElement;
    while (noeud) {
      if (getComputedStyle(noeud).overflowX !== "visible") return true;
      noeud = noeud.parentElement;
    }
    return false;
  };
  for (const element of document.querySelectorAll("body *")) {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.right <= largeur + 0.5) continue;
    if (coupe(element)) continue;
    resultat.push(`${element.tagName.toLowerCase()}.${(element.getAttribute("class") ?? "").split(" ").slice(0, 4).join(".")} right=${Math.round(rect.right)} w=${Math.round(rect.width)} <<${(element.textContent ?? "").trim().slice(0, 30)}>>`);
  }
  return { scroll: document.documentElement.scrollWidth, largeur, resultat: resultat.slice(0, 10) };
});
console.log(JSON.stringify(debordement, null, 2));
await browser.close();