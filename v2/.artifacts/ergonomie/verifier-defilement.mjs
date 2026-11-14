/**
 * Vérifie si le débordement horizontal annoncé à 320 px est **réellement
 * visible** (la page peut défiler) ou seulement calculé.
 *
 * Usage : node .artifacts/ergonomie/verifier-defilement.mjs <base> <route> [route...]
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
  const r = await page.evaluate(async () => {
    const html = document.documentElement;
    // Affectation directe (le défilement doux de `scrollTo` peut être différé)
    // puis attente d'une frame avant lecture.
    window.scrollTo(0, 0);
    html.scrollLeft = 9999;
    const apresHtml = html.scrollLeft;
    document.body.scrollLeft = 9999;
    const apresBody = document.body.scrollLeft;
    await new Promise((suite) => requestAnimationFrame(() => suite(null)));
    const x = window.scrollX;
    html.scrollLeft = 0;
    document.body.scrollLeft = 0;
    const plusADroite = [...document.querySelectorAll("*")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          classe: (element.getAttribute("class") ?? "").slice(0, 40),
          droite: Math.round(rect.right),
          largeur: Math.round(rect.width),
          position: style.position,
          display: style.display,
          parent: element.parentElement?.tagName.toLowerCase() ?? "",
        };
      })
      .sort((a, b) => b.droite - a.droite)
      .slice(0, 3);
    return {
      htmlScroll: html.scrollWidth,
      htmlClient: html.clientWidth,
      bodyScroll: document.body.scrollWidth,
      overflowHtmlX: getComputedStyle(html).overflowX,
      overflowBodyX: getComputedStyle(document.body).overflowX,
      defile: x,
      apresHtml,
      apresBody,
      plusADroite,
    };
  });
  console.log(
    `${route} : html ${r.htmlScroll}/${r.htmlClient} · body ${r.bodyScroll} · scrollLeft html=${r.apresHtml} body=${r.apresBody} · scrollX=${r.defile}`,
  );
  for (const e of r.plusADroite) {
    console.log(
      `   droite=${e.droite} largeur=${e.largeur} ${e.tag}.${e.classe} (parent ${e.parent}, ${e.position}/${e.display})`,
    );
  }
}

await navigateur.close();