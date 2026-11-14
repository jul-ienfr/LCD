/**
 * T031 — Mesure des cibles tactiles et du débordement horizontal à 320 × 568.
 *
 * Usage :
 *   node scripts/mesurer-cibles.mjs
 *   BASE_URL=http://127.0.0.1:4173 CIBLES_PAGES=/reserver node scripts/mesurer-cibles.mjs
 *
 * Sortie : `.artifacts/ergonomie/cibles.json` (surchargeable par CIBLES_OUT).
 * Code de sortie : 0 si toutes les cibles passent, 1 sinon (utilisable en CI).
 *
 * Règles appliquées (`contracts/ergonomie.md`) :
 *   - cible tactile ≥ 44 px de largeur ET ≥ 44 px de hauteur ;
 *   - liens de texte inline exclus (sauf CIBLES_LIENS_INLINE=1) ;
 *   - aucun défilement horizontal toléré.
 */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { mesurerCiblesPage } from "./lib/mesure-cibles.mjs";

const base = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const routes = (
  process.env.CIBLES_PAGES ??
  process.env.AUDIT_PAGES ??
  "/,/reserver,/login,/voyageur"
)
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);

const outDir = process.env.AUDIT_OUT ?? ".artifacts/ergonomie";
const outFile = process.env.CIBLES_OUT ?? path.join(outDir, "cibles.json");
const seuilPx = Number(process.env.CIBLES_SEUIL_PX ?? 44);
const inclureLiensInline = process.env.CIBLES_LIENS_INLINE === "1";
const viewport = { width: 320, height: 568 };

await mkdir(path.dirname(outFile), { recursive: true });

const browser = await chromium.launch();
const results = [];

try {
  /*
   * Les routes staff exigent une session : si `CIBLES_EMAIL` et
   * `CIBLES_MOT_DE_PASSE` sont fournis, on se connecte une fois dans un
   * contexte partagé par toutes les routes mesurées.
   */
  let contexte = null;
  if (process.env.CIBLES_EMAIL && process.env.CIBLES_MOT_DE_PASSE) {
    contexte = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const pageConnexion = await contexte.newPage();
    await pageConnexion.goto(`${base}/login`, { waitUntil: "load" });
    await pageConnexion.fill('input[name="email"]', process.env.CIBLES_EMAIL);
    await pageConnexion.fill(
      'input[name="password"]',
      process.env.CIBLES_MOT_DE_PASSE,
    );
    await pageConnexion.click('button[type="submit"]');
    await pageConnexion.waitForURL(/\/hote|\/presta|\/commercial|\/proprio/, {
      timeout: 30000,
    });
    await pageConnexion.close();
  }

  for (const route of routes) {
    const page = contexte
      ? await contexte.newPage()
      : await browser.newPage({ viewport, deviceScaleFactor: 1 });
    let status = null;
    try {
      const response = await page.goto(`${base}${route}`, {
        waitUntil: "load",
        timeout: 30000,
      });
      status = response?.status() ?? null;
      await page.waitForTimeout(400);
      const mesure = await mesurerCiblesPage(page, { seuilPx, inclureLiensInline });
      results.push({ route, status, erreur: null, ...mesure });
    } catch (error) {
      results.push({
        route,
        status,
        erreur: error instanceof Error ? error.message : String(error),
        overflowPx: null,
        smallTargets: [],
        controleCount: 0,
        exclusionsLiensInline: 0,
      });
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}

const totalCibles = results.reduce((total, r) => total + r.smallTargets.length, 0);
const routesEnDebordement = results
  .filter((r) => (r.overflowPx ?? 0) > 0)
  .map((r) => r.route);

const rapport = {
  tache: "T031",
  base,
  viewport,
  seuilPx,
  liensInlineExclus: !inclureLiensInline,
  mesureLe: new Date().toISOString(),
  routes,
  resume: {
    routes: routes.length,
    ciblesSousSeuil: totalCibles,
    routesEnDebordement,
    ok: totalCibles === 0 && routesEnDebordement.length === 0,
  },
  results,
};

await writeFile(outFile, `${JSON.stringify(rapport, null, 2)}\n`, "utf8");

for (const result of results) {
  const marque = result.smallTargets.length > 0 || (result.overflowPx ?? 0) > 0 ? "KO" : "OK";
  console.log(
    `[${marque}] ${result.route} — cibles < ${seuilPx} px : ${result.smallTargets.length}` +
      ` · débordement : ${result.overflowPx ?? "?"} px` +
      (result.erreur ? ` · erreur : ${result.erreur}` : ""),
  );
}
console.log(`Rapport écrit : ${outFile}`);
console.log(
  `Résumé : ${totalCibles} cible(s) sous le seuil, ${routesEnDebordement.length} route(s) en débordement.`,
);

process.exitCode = rapport.resume.ok ? 0 : 1;
