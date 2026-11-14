/**
 * Recense les liens qui seraient touchés par une règle globale de cible tactile
 * et vérifie qu'aucun n'enveloppe un bloc (carte cliquable), cas où
 * `display: inline-flex` casserait la mise en page.
 *
 * Usage : node .artifacts/ergonomie/sonder-liens.mjs <base> <route> [route...]
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
    const prose = "p a, li a, label a, figcaption a";
    const bloc = (element) => {
      for (const enfant of element.children) {
        const display = getComputedStyle(enfant).display;
        if (["block", "flex", "grid", "table", "list-item"].includes(display)) {
          return true;
        }
      }
      return false;
    };
    const tous = [...document.querySelectorAll("a")];
    const horsProse = tous.filter((a) => !a.matches(prose));
    return {
      total: tous.length,
      horsProse: horsProse.length,
      sousSeuil: horsProse.filter(
        (a) => a.getBoundingClientRect().height < 44,
      ).length,
      avecBloc: horsProse
        .filter(bloc)
        .map((a) => ({
          classe: (a.getAttribute("class") ?? "").slice(0, 40),
          texte: (a.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 30),
        }))
        .slice(0, 5),
    };
  });
  console.log(
    `${route} : liens=${r.total} hors prose=${r.horsProse} sous 44 px=${r.sousSeuil} englobant un bloc=${r.avecBloc.length}`,
  );
  for (const a of r.avecBloc) {
    console.log(`   ${a.classe} | « ${a.texte} »`);
  }
}

await navigateur.close();