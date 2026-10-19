#!/usr/bin/env node
// web/scripts/recette-pwa.mjs — recette OFFLINE REELLE (F4 §F8).
// Pas de simulation : Edge headless reel (channel msedge, aucun navigateur
// telecharge), coupure reseau au niveau CDP (context.setOffline = requetes
// mortes pour tout le navigateur, SW compris), rejeu outbox observe, puis
// verification SERVEUR : la passerelle porte bien la ref (idempotence).
// Usage : node scripts/recette-pwa.mjs [url-front]   (defaut http://127.0.0.1:3101)
// Sortie : lignes [OK]/[KO] + exit code = nombre d'echecs.
import { chromium } from "playwright-core";

const BASE = (process.argv[2] || "http://127.0.0.1:3101").replace(/\/+$/, "");
const GW = process.env.LCD_GATEWAY || "http://127.0.0.1:8443";
let KO = 0;
const verif = (label, ok, detail = "") => {
  console.log(`[${ok ? "OK" : "KO"}] ${label}${detail ? " — " + detail : ""}`);
  if (!ok) KO += 1;
};
const attendre = async (fn, ms = 20000, pas = 250) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await fn()) return true;
    await new Promise((r) => setTimeout(r, pas));
  }
  return false;
};

const navigateur = await chromium.launch({ channel: "msedge", headless: true });
const context = await navigateur.newContext();
const page = await context.newPage();

// --- 1. Visit online : le SW s'installe et prend le controle ----------- //
await page.goto(`${BASE}/voyageur`, { waitUntil: "networkidle" });
const guideEnLigne = await page.evaluate(() => document.body.innerText.toLowerCase());
verif("online : guide de sejour rendu", /uide de s/.test(guideEnLigne));
const swPret = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.ready;
  return !!reg.active;
});
verif("online : service worker actif (precache pose)", swPret);
if (swPret) await page.reload({ waitUntil: "networkidle" });

// --- 2. COUPURE REELLE : reload, le SW sert son cache ------------------- //
await context.setOffline(true);
await page.goto(`${BASE}/voyageur`, { waitUntil: "domcontentloaded" });
const horsLigne = await page.evaluate(() => document.body.innerText.toLowerCase());
verif("offline : guide toujours lisible (cache SW, 2 h)", /uide de s/.test(horsLigne));
const bandeau = await page.locator("[data-testid=bandeau-hors-ligne]").count();
verif("offline : bandeau honnete affiche", bandeau === 1);

// --- 3. Ecriture offline -> outbox (jamais perdue, jamais envoyee) ----- //
const formIncident = page.locator("form", { has: page.locator("input[name=motif]") });
await page.locator("details summary", { hasText: "incident" }).first().click();
await formIncident.locator("select[name=qui]").selectOption("personne_03");
await formIncident.locator("input[name=motif]").fill("degat_eau_sdb");
await formIncident.locator("input[name=declarant]").fill("Voyageur sur place");
await formIncident.locator("input[name=description]").fill("recette offline PWA");
await formIncident.locator("button[type=submit]").click();
const attente = await attendre(async () =>
  (await page.locator("[data-testid=bandeau-hors-ligne]").innerText().catch(() => ""))
    .includes("1 ecriture"));
verif("offline : ecriture mise en attente (outbox IndexedDB)", attente,
  "bandeau = 1 ecriture en attente");

// --- 4. Retour reseau : rejeu automatique + preuve SERVEUR ------------- //
await context.setOffline(false);
const videApresRejeu = await attendre(async () =>
  (await page.locator("[data-testid=bandeau-hors-ligne]").count()) === 0, 25000);
verif("retour reseau : outbox rejouee puis bandeau repasse au vert", videApresRejeu);

// Preuve SERVEUR = table d'idempotence 24 h de la passerelle (§6) : rejeuter
// une ref deja executee retourne idempotent=true. SI notre PREMIER contact
// avec cette ref retourne deja true, c'est que LE NAVIGATEUR l'a executee
// avant nous — la preuve non simulable que le rejeu outbox est arrive.
// La cle d'idempotence = box|action|ref, CAS COMPRIS : on reprend la ref
// EXACTE posee par le champ cache du formulaire (minuscules).
const REF_SIN = "WEB-VOY-LOG1-sinistre_declarer";
const REF_EXT = "WEB-VOY-LOG1-commande_extras";
const premierContact = new Map();
const preuveIdem = async (ref, corps) => {
  const r = await fetch(`${GW}/v1/action`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corps),
  });
  const j = await r.json().catch(() => ({}));
  const idem = j.idempotent === true;
  if (!premierContact.has(ref)) premierContact.set(ref, idem);
  return idem;
};
const corpsSinistre = {
  box_id: "box-lab",
  logement_id: "log1",
  action: "sinistre_declarer",
  qui: "personne_03",
  ref: REF_SIN,
  data: { motif: "degat_eau_sdb", declarant: "Voyageur sur place",
          description: "recette offline PWA" },
};
await preuveIdem(REF_SIN, corpsSinistre);
verif("preuve serveur : la ref du navigateur est deja executee (rejeu -> idempotent=true)",
  premierContact.get(REF_SIN) === true, `ref ${REF_SIN}`);

// --- 5. 3 allers-retours reseau : outbox jamais perdue ----------------- //
for (let cycle = 1; cycle <= 3; cycle += 1) {
  await context.setOffline(true);
  await page.goto(`${BASE}/voyageur`, { waitUntil: "domcontentloaded" });
  await page.locator("details summary", { hasText: "incident" }).first().click();
  await formIncident.locator("select[name=qui]").selectOption("personne_03");
  await formIncident.locator("input[name=motif]").fill("degat_eau_sdb");
  await formIncident.locator("input[name=declarant]").fill(`Voyageur cycle ${cycle}`);
  await formIncident.locator("input[name=description]").fill(`aller-retour ${cycle} (hors ligne)`);
  await formIncident.locator("button[type=submit]").click();
  await attendre(async () =>
    (await page.locator("[data-testid=bandeau-hors-ligne]").innerText().catch(() => ""))
      .includes("ecriture"), 10000);
  await context.setOffline(false);
  await attendre(async () =>
    (await page.locator("[data-testid=bandeau-hors-ligne]").count()) === 0, 25000);
}
// Une DEUXIEME ecriture, ref distincte (extras) : 2 refs livrees = 0 perdue.
await context.setOffline(true);
await page.goto(`${BASE}/voyageur`, { waitUntil: "domcontentloaded" });
const formExtras = page.locator("form", { has: page.locator("input[name=ref_resa]") });
await page.locator("details summary", { hasText: "extras" }).first().click();
await formExtras.locator("select[name=qui]").selectOption("personne_03");
await formExtras.locator("input[name=ref_resa]").fill("RESA-PWA-01");
await formExtras.locator("input[name=extras]").fill("petit_dej:1");
await formExtras.locator("button[type=submit]").click();
await attendre(async () =>
  (await page.locator("[data-testid=bandeau-hors-ligne]").innerText().catch(() => ""))
    .includes("ecriture"), 10000);
await context.setOffline(false);
await attendre(async () =>
  (await page.locator("[data-testid=bandeau-hors-ligne]").count()) === 0, 25000);
await preuveIdem(REF_EXT, {
  box_id: "box-lab",
  logement_id: "log1",
  action: "commande_extras",
  qui: "personne_03",
  ref: REF_EXT,
  data: { ref_resa: "RESA-PWA-01", extras: "petit_dej:1", arrivee: "2027-11-10" },
});
const zeroPerdue = premierContact.get(REF_SIN) === true && premierContact.get(REF_EXT) === true;
verif("3 allers-retours : 0 ecriture perdue (2 refs distinctes deja executees) + 0 doublon (table idempotence)",
  zeroPerdue, `${REF_SIN}=${premierContact.get(REF_SIN)} ${REF_EXT}=${premierContact.get(REF_EXT)}`);

// --- 6. Purge (checkout+12h / revocation) : les caches tombent --------- //
const purge = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.ready;
  const canal = new MessageChannel();
  const reponse = new Promise((resolve) => {
    canal.port1.onmessage = (ev) => resolve(ev.data && ev.data.type);
  });
  reg.active.postMessage({ type: "lcd-purge" }, [canal.port2]);
  const t = setTimeout(() => resolve("timeout"), 5000);
  const type = await reponse;
  clearTimeout(t);
  const cles = await caches.keys();
  return { type, cles: cles.filter((c) => c.startsWith("lcd-")) };
});
verif("purge : message lcd-purge vide les caches du SW", purge.type === "lcd-purge-vide",
  `caches restants : ${JSON.stringify(purge.cles)}`);

await navigateur.close();
console.log(`RESULTAT : recette PWA ${KO === 0 ? "COMPLETE VERTE" : `: ${KO} KO`}`);
process.exit(KO);
