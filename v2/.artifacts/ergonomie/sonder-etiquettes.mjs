/**
 * Liste les contrôles sans étiquette associée sur une route (contrôle a11y
 * complémentaire de l'audit 320 px).
 *
 * Usage : node .artifacts/ergonomie/sonder-etiquettes.mjs <base> <route...>
 */
import { chromium } from "playwright";

const base = process.argv[2];
const cibles = process.argv.slice(3);
const navigateur = await chromium.launch();
const contexte = await navigateur.newContext({
  viewport: { width: 320, height: 568 },
  ...(process.env.AUDIT_STORAGE ? { storageState: process.env.AUDIT_STORAGE } : {}),
});
const page = await contexte.newPage();

for (const route of cibles) {
  await page.goto(`${base}${route}`, { waitUntil: "load" });
  const lignes = await page.evaluate(() => {
    const sortie = [];
    const contrôles = document.querySelectorAll("input, select, textarea");
    for (const element of contrôles) {
      if (element.type === "hidden") continue;
      const id = element.getAttribute("id");
      const parFor = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
      const parEnveloppe = element.closest("label");
      const aria =
        element.getAttribute("aria-label") ??
        element.getAttribute("aria-labelledby");
      if (parFor || parEnveloppe || aria) continue;
      sortie.push(
        `<${element.tagName.toLowerCase()} type=${element.getAttribute("type") ?? "-"} name=${element.getAttribute("name") ?? "-"} id=${id ?? "-"}>`,
      );
    }
    return sortie;
  });
  console.log(`=== ${route} : ${lignes.length} contrôle(s) sans étiquette`);
  for (const ligne of lignes) console.log(`   ${ligne}`);
}

await navigateur.close();