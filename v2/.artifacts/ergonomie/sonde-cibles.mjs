/**
 * Sonde ponctuelle : quels éléments sont sous 44 px sur une route, à 320 × 568,
 * avec le détail du style calculé (pour trancher un écart d'audit).
 *
 * Usage : node .artifacts/ergonomie/sonde-cibles.mjs [base] [route...]
 */
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? process.env.BASE_URL ?? "http://127.0.0.1:4173";
const routes = process.argv.slice(3);
if (routes.length === 0) routes.push("/reserver", "/voyageur", "/");

const navigateur = await chromium.launch();
// Le build `adapter-node` (prod, port 4180) attend les en-têtes d'un reverse
// proxy ; le serveur de développement (4173) boucle si on les lui envoie.
const entetesProxy =
  process.env.PROXY_ENTETES === "1"
    ? {
        "x-forwarded-proto": "http",
        "x-forwarded-host": new URL(base).host,
      }
    : undefined;
const contexte = await navigateur.newContext({
  viewport: { width: 320, height: 568 },
  deviceScaleFactor: 1,
  locale: "fr-FR",
  ...(entetesProxy ? { extraHTTPHeaders: entetesProxy } : {}),
});
await contexte.addCookies(
  process.env.COOKIES === "1"
    ? [
        { name: "lcd_langue", value: "fr", url: base },
        { name: "lcd_consentement", value: "v1.m1.p0", url: base },
      ]
    : [{ name: "lcd_langue", value: "fr", url: base }],
);
const page = await contexte.newPage();

for (const route of routes) {
  const reponse = await page.goto(`${base}${route}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(400);
  const petits = await page.evaluate(() => {
    const seuil = 44;
    const sortie = [];
    for (const element of document.querySelectorAll("body *")) {
      const r = element.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.width >= seuil && r.height >= seuil) continue;
      const style = getComputedStyle(element);
      sortie.push({
        balise: element.tagName.toLowerCase(),
        classe: element.getAttribute("class") ?? "",
        texte: (element.textContent ?? "").trim().slice(0, 40),
        largeur: Math.round(r.width * 10) / 10,
        hauteur: Math.round(r.height * 10) / 10,
        minLargeur: style.minWidth,
        minHauteur: style.minHeight,
        padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
        parent: element.parentElement?.tagName.toLowerCase() ?? "",
        parentClasse: element.parentElement?.getAttribute("class") ?? "",
        position: style.position,
        overflowParent: element.parentElement
          ? getComputedStyle(element.parentElement).overflowX
          : "",
      });
    }
    return sortie;
  });
  console.log(`\n=== ${route} (status ${reponse?.status()}) — ${petits.length} élément(s) < 44 px`);
  for (const p of petits.slice(0, 25)) {
    console.log(
      `  <${p.balise} class="${p.classe.slice(0, 60)}"> "${p.texte}"  ${p.largeur}×${p.hauteur}  min=${p.minLargeur}/${p.minHauteur} pad=${p.padding}  parent=<${p.parent} class="${p.parentClasse.slice(0, 40)}"> overflow=${p.overflowParent}`,
    );
  }
}

await navigateur.close();
