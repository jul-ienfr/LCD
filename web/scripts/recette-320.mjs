#!/usr/bin/env node
// recette-320.mjs — LE MODE DEGRADE L1 A 320 px (cahier 70 §F0.5 et §F7 :
// « 320 px sans defilement horizontal »).
//
// POURQUOI CE SCRIPT EXISTE : la promesse est ecrite depuis la premiere
// version du cahier 70 et AUCUNE batterie ne la mesurait — ni test-front, ni
// les recettes navigateur, ni test-pwa. C'est exactement le vice que §F0.5
// interdit : une promesse non mesuree peut devenir fausse en silence.
//
// MESURE, PAS SIMULATION : Edge headless reel via playwright-core
// (channel msedge, meme outil que recette-sans-js.mjs, aucun navigateur
// telecharge = 0 outil payant) charge chaque surface cliente a 320x568 et lit
// `document.documentElement.scrollWidth` contre `clientWidth` — c'est la
// definition du defilement horizontal. Un ecart de 1 px est tolere (arrondi
// sous-pixel du rendu), au-dela c'est un debordement reel.
//
// CONTROLE POSITIF OBLIGATOIRE : une page fabriquee portant un bloc de 600 px
// doit etre VUE en debordement a 320 px. Sans ce temoin, une mesure qui ne
// detecte jamais rien passerait a tout va.
//
// Usage : node scripts/recette-320.mjs [url-front]
// Sortie : lignes [OK]/[KO] + exit code = nombre d'echecs.
import { chromium } from "playwright-core";

const BASE = (process.argv[2] || "http://127.0.0.1:3101").replace(/\/+$/, "");
const LARGEUR = 320;
const HAUTEUR = 568;
const TOLERANCE = 1;

let KO = 0;
const verif = (label, ok, detail = "") => {
  console.log(`[${ok ? "OK" : "KO"}] ${label}${detail ? " - " + detail : ""}`);
  if (!ok) KO += 1;
};

// Surfaces CLIENTES uniquement : /hote et /systeme sont des consoles
// operateur (§F0.6), hors du chemin 320 px promis aux voyageurs.
const surfaces = ["/", "/voyageur", "/presta", "/proprio", "/login", "/aide"];

const navigateur = await chromium.launch({ channel: "msedge", headless: true });
const contexte = await navigateur.newContext({
  viewport: { width: LARGEUR, height: HAUTEUR },
});
const page = await contexte.newPage();

const mesurer = () =>
  page.evaluate(() => {
    const d = document.documentElement;
    return { scroll: d.scrollWidth, client: d.clientWidth, inner: window.innerWidth };
  });

// --- Controle positif AVANT toute mesure de page --------------------------
await page.setContent(
  `<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<div style="width:600px;height:20px;background:#000"></div>`,
);
const temoin = await mesurer();
verif(
  "controle positif : un bloc de 600 px est VU en debordement a 320 px",
  temoin.scroll > temoin.client + TOLERANCE,
  `scroll=${temoin.scroll} client=${temoin.client}`,
);

// --- Les 6 surfaces clientes ---------------------------------------------
for (const chemin of surfaces) {
  const rep = await page.goto(BASE + chemin, {
    waitUntil: "load",
    timeout: 30000,
  });
  const m = await mesurer();
  verif(
    `320 px ${chemin} : aucun defilement horizontal`,
    m.scroll <= m.client + TOLERANCE,
    `scroll=${m.scroll} client=${m.client} statut=${rep ? rep.status() : 0}`,
  );
}

await navigateur.close();
console.log(
  KO === 0
    ? `320 OK (${surfaces.length} surfaces + 1 temoin mesures)`
    : `320 : ${KO} ECHEC(S)`,
);
process.exit(KO);
