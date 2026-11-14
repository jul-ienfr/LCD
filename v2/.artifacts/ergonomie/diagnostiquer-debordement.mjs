/**
 * Diagnostique le débordement horizontal à 320 px : liste les éléments dont la
 * boîte dépasse la largeur du viewport, du plus large au plus étroit.
 *
 * Usage : node .artifacts/ergonomie/diagnostiquer-debordement.mjs <base> <route> [route...]
 * Session staff : AUDIT_EMAIL / AUDIT_MOT_DE_PASSE (facultatif).
 */
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:4173";
const cibles = process.argv.slice(3);
const email = process.env.AUDIT_EMAIL;
const motDePasse = process.env.AUDIT_MOT_DE_PASSE;

const navigateur = await chromium.launch({ headless: true });
const contexte = await navigateur.newContext({
  viewport: { width: 320, height: 568 },
  locale: "fr-FR",
});
await contexte.addCookies([{ name: "lcd_langue", value: "fr", url: base }]);
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
  console.log(`session ouverte : ${page.url()}`);
}

for (const route of cibles) {
  await page.goto(`${base}${route}`, { waitUntil: "load" });
  const rapport = await page.evaluate(() => {
    const largeurVue = document.documentElement.clientWidth;
    const estClippe = (element) => {
      let parent = element.parentElement;
      while (parent && parent !== document.documentElement) {
        const style = getComputedStyle(parent);
        if (["auto", "hidden", "scroll", "clip"].includes(style.overflowX)) {
          return true;
        }
        parent = parent.parentElement;
      }
      return false;
    };
    const coupables = [];
    for (const element of document.querySelectorAll("*")) {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const debord = Math.round(rect.right - largeurVue);
      if (debord > 1 && !estClippe(element)) {
        coupables.push({
          tag: element.tagName.toLowerCase(),
          classe: (element.getAttribute("class") ?? "").slice(0, 60),
          texte: (element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40),
          largeur: Math.round(rect.width),
          debord,
        });
      }
    }
    return {
      document: document.documentElement.scrollWidth,
      vue: largeurVue,
      coupables: coupables.sort((a, b) => b.debord - a.debord).slice(0, 8),
      plusLarges: [...document.querySelectorAll("body *")]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const chaine = [];
          let parent = element.parentElement;
          while (parent && chaine.length < 8) {
            const style = getComputedStyle(parent);
            chaine.push(
              `${parent.tagName.toLowerCase()}.${(parent.getAttribute("class") ?? "").slice(0, 24)}[${Math.round(parent.getBoundingClientRect().width)}px/${style.overflowX}/${style.display}]`,
            );
            parent = parent.parentElement;
          }
          return {
            tag: element.tagName.toLowerCase(),
            classe: (element.getAttribute("class") ?? "").slice(0, 50),
            largeur: Math.round(rect.width),
            chaine: chaine.join(" < "),
          };
        })
        .sort((a, b) => b.largeur - a.largeur)
        .slice(0, 3),
    };
  });
  console.log(
    `${route} : scrollWidth=${rapport.document} viewport=${rapport.vue}`,
  );
  for (const c of rapport.coupables) {
    console.log(
      `   ${c.tag}.${c.classe} | ${c.largeur}px | dépasse de ${c.debord}px | « ${c.texte} »`,
    );
  }
  for (const c of rapport.plusLarges) {
    console.log(`   [large] ${c.tag}.${c.classe} | ${c.largeur}px | ${c.chaine}`);
  }
}

await navigateur.close();