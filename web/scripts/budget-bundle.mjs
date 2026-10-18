#!/usr/bin/env node
// web/scripts/budget-bundle.mjs — garde-fou BUDGET JS/page (§S3.4.6).
// Next 16 (turbopack) ne produit PLUS `.next/app-build-manifest.json`
// (constaté 2026-10-18, builds turbo ET webpack ; AGENTS/next docs) —
// la mesure exacte par route se fait donc côté SSR : le garde-fou
// lance `next start` sur un port lab, fetch chaque route du
// `app-path-routes-manifest.json`, collecte les `/static/chunks/*.js`
// référencés par le HTML servi (script src + modulepreload) et somme
// leurs tailles disque. = le JS réellement chargé au premier rendu.
// 0 dépendance (node:fs/fetch/spawn seul). Exit 1 si une route dépasse
// le budget (ou est injoignable — jamais de garde-fou muet).
// Budget : 200 Ko/page (figé §S3.4.6) — surcharge LCD_BUDGET_KO pour lab.
import { readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.LCD_BUDGET_PORT || 3917);
const BUDGET_KO = Number(process.env.LCD_BUDGET_KO || 200);
const TIMEOUT_S = Number(process.env.LCD_BUDGET_TIMEOUT_S || 90);

const MANIFESTE_ROUTES = join(RACINE, ".next", "app-path-routes-manifest.json");
if (!existsSync(MANIFESTE_ROUTES)) {
  console.log("[KO] .next/app-path-routes-manifest.json absent : lancer `next build` d'abord.");
  process.exit(1);
}
const routes = Object.keys(JSON.parse(readFileSync(MANIFESTE_ROUTES, "utf8")))
  // clés = ids serveur ("/hote/page") -> routes publiques ;
  // /api/* n'a pas de bundle page ; /_* = routes internes (404,
  // global-error) jamais servies seules.
  .map((r) => (r === "/page" ? "/" : r.replace(/\/(page|route)$/, "")))
  .filter((r) => !r.startsWith("/api/") && !r.startsWith("/_"));

// --- serveur prod éphémère -------------------------------------------------
const serveur = spawn(process.execPath, [join(RACINE, ".next/standalone/server.js")],
  { env: { ...process.env, PORT: String(PORT), HOSTNAME: "127.0.0.1" }, stdio: "ignore" });
let okSrv = false;
const deadline = Date.now() + TIMEOUT_S * 1000;
while (Date.now() < deadline && !okSrv) {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/`);
    if (r.status < 500) okSrv = true;
  } catch {
    await new Promise((res) => setTimeout(res, 700));
  }
}
if (!okSrv) {
  serveur.kill();
  console.log("[KO] le serveur prod standalone n'a pas démarré (garde-fou muet = refusé).");
  process.exit(1);
}

// honnêteté : la taille d'un chunk est celle du FICHIER disque (le
// navigateur le sert gzippé/µ-op — le budget est un PLAFOND pessimiste).
// honnêteté : la taille brute = lecture disque (plafond pessimiste) ;
// la taille GZIP = ce que le navigateur télécharge (serveur prod
// compresse) — le budget §S3.4.6 « JS <200 Ko/page » s'applique au
// TRANSFERT (convention Lighthouse), le brut est affiché pour info.
import { gzipSync } from "node:zlib";

function tailles(chemin) {
  try {
    const brut = readFileSync(join(RACINE, ".next", chemin.replace("/_next/", "")));
    return { brut: brut.length, gzip: gzipSync(brut).length };
  } catch {
    return null; // chunk référencé mais abs disque : KO, jamais muet
  }
}

async function mesure(route) {
  const r = await fetch(`http://127.0.0.1:${PORT}${route === "/" ? "/" : route}`,
    { redirect: "follow", signal: AbortSignal.timeout(20000) });
  if (r.status >= 400) return { ok: false, ko: `HTTP ${r.status}` };
  const html = await r.text();
  const vus = new Set();
  for (const m of html.matchAll(/(?:src|href)="(\/_next\/static\/chunks\/[^"]+\.js[^"]*)"/g)) {
    vus.add(m[1].split("?")[0]);
  }
  let bRaw = 0, bGzip = 0;
  for (const c of vus) {
    const n = tailles(c);
    if (n === null) return { ok: false, ko: `chunk absent disque : ${c}` };
    bRaw += n.brut; bGzip += n.gzip;
  }
  return { ok: true, raw: bRaw / 1024, gzip: bGzip / 1024, chunks: vus.size };
}

// --- passe ---------------------------------------------------------------
const lignes = [];
let ko = 0;
for (const route of routes.sort()) {
  try {
    const res = await mesure(route);
    if (!res.ok) { ko += 1; lignes.push(`[KO] ${route} : ${res.ko}`); continue; }
    const dehors = res.gzip > BUDGET_KO;
    if (dehors) ko += 1;
    lignes.push(`${dehors ? "[KO]" : "[OK]"} ${route} : ${res.gzip.toFixed(1)} Ko JS initial (gzip ; brut ${res.raw.toFixed(1)} Ko ; ${res.chunks} chunks, budget ${BUDGET_KO} Ko)`);
  } catch (e) {
    ko += 1;
    lignes.push(`[KO] ${route} : ${e.message}`);
  }
}
serveur.kill();

// une page qui charge via un nav client réel persiste dans le même
// régime budget (peu de JS client islands ici, §F0).
lignes.sort();
for (const l of lignes) console.log(l);
console.log(ko === 0 ? "RESULTAT : budgets OK" : `RESULTAT : ${ko} ECHEC(S)`);
process.exit(ko === 0 ? 0 : 1);
