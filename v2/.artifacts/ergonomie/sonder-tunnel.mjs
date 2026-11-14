/**
 * Sonde le tunnel de réservation pas à pas pour comprendre pourquoi le bloc de
 * prix n'apparaît plus : pour trois candidats publiés, on note le logement, la
 * présence du bloc `[data-resume-prix]` et le texte des alertes affichées.
 */
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const JOUR = 86_400_000;
const troisNuits = (decalage) => ({
  debut: new Date(Date.now() + decalage * JOUR).toISOString().slice(0, 10),
  fin: new Date(Date.now() + (decalage + 3) * JOUR).toISOString().slice(0, 10),
});

const navigateur = await chromium.launch();
const contexte = await navigateur.newContext({ viewport: { width: 1280, height: 900 } });
const page = await contexte.newPage();

await page.goto(`${base}/reserver?tenant=lcd`, { waitUntil: "domcontentloaded" });
const cartes = page.locator('a[href*="/reserver?tenant=lcd&logement="]');
const liens = [];
for (let i = 0; i < (await cartes.count()); i++) {
  const href = await cartes.nth(i).getAttribute("href");
  if (href && !liens.includes(href)) liens.push(href);
}
console.log(`${liens.length} candidats dans le sélecteur`);

for (const [index, lien] of liens.slice(0, 4).entries()) {
  const { debut, fin } = troisNuits(30 + index * 17);
  await page.goto(`${base}${lien}`, { waitUntil: "domcontentloaded" });
  const nom = (await page.locator("#etape-1 h3").first().innerText().catch(() => "?")).trim();
  await page.locator('#etape-1 input[name="debut"]').fill(debut);
  await page.locator('#etape-1 input[name="fin"]').fill(fin);
  await page.locator('#etape-1 input[name="voyageurs"]').fill("2");
  await page.getByRole("button", { name: "Calculer le prix" }).click();
  const prix = await page
    .locator("[data-resume-prix]")
    .waitFor({ state: "visible", timeout: 6000 })
    .then(() => true)
    .catch(() => false);
  const alertes = await page.locator('[role="alert"]').allInnerTexts();
  console.log(
    `\n#${index} ${nom} ${debut} → ${fin} : prix=${prix ? "OUI" : "non"}`,
  );
  for (const alerte of alertes.map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean)) {
    console.log(`    alerte: ${alerte.slice(0, 160)}`);
  }
}

await navigateur.close();