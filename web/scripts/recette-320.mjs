#!/usr/bin/env node
// recette-320.mjs — LE MODE DEGRADE L1 A 320 px (cahier 70 §F0.5 et §F7 :
// « 320 px sans defilement horizontal ») ET LES CIBLES TACTILES 44 px
// (§F7 règle 2).
//
// POURQUOI CE SCRIPT EXISTE : la promesse 320 px est ecrite depuis la premiere
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
// DEUXIEME MESURE : tout CONTROLE (button, select, input visible, textarea)
// doit mesurer >= 44 px dans chaque dimension (§F7 regle 2). Les liens de
// texte inline sont hors perimetre : une cible tactile est un bouton, pas une
// phrase. Garde-fou : si une surface ne rend AUCUN controle, la verification
// echoue (boucle vide = preuve de rien).
//
// CONTROLES POSITIFS OBLIGATOIRES : une page fabriquee portant un bloc de
// 600 px doit etre VUE en debordement a 320 px, et un bouton fabrique de
// 10x10 px doit etre VU sous 44 px. Sans ces temoins, une mesure qui ne
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

// --- Cibles tactiles >= 44 px (cahier 70 §F7 regle 2) ---------------------
const ciblesDe = () =>
  page.evaluate(() => {
    const sel = "button, select, input, textarea, [role=button]";
    return [...document.querySelectorAll(sel)]
      .map((el) => {
        const r = el.getBoundingClientRect();
        const st = getComputedStyle(el);
        const visible =
          r.width > 0 &&
          r.height > 0 &&
          st.visibility !== "hidden" &&
          st.display !== "none" &&
          el.type !== "hidden";
        if (!visible) return null;
        return {
          tag: el.tagName.toLowerCase(),
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
      })
      .filter(Boolean);
  });

// Controle positif : un bouton fabrique de 10x10 px DOIT etre vu trop petit.
await page.setContent(
  `<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<button style="width:10px;height:10px">x</button>`,
);
const temoinCibles = await ciblesDe();
verif(
  "controle positif : un bouton de 10x10 px est VU sous 44 px",
  temoinCibles.some((c) => c.w < 44 || c.h < 44),
  `controles=${temoinCibles.length}`,
);

for (const chemin of surfaces) {
  await page.goto(BASE + chemin, { waitUntil: "load", timeout: 30000 });
  const cibles = await ciblesDe();
  const petits = cibles.filter((c) => c.w < 44 || c.h < 44);
  verif(
    `44 px ${chemin} : controles tous >= 44 px`,
    cibles.length > 0 && petits.length === 0,
    `${cibles.length} controles, ${petits.length} sous 44` +
      (petits.length
        ? ` (${petits.map((c) => `${c.tag} ${c.w}x${c.h}`).join(", ")})`
        : ""),
  );
}

await navigateur.close();
console.log(
  KO === 0
    ? `320/cibles OK (${surfaces.length} surfaces + 2 temoins mesures)`
    : `320/cibles : ${KO} ECHEC(S)`,
);
process.exit(KO);
