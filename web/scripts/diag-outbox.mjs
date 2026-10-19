#!/usr/bin/env node
// Diagnostique F4 : que contient l'outbox apres soumission offline, et que
// le navigateur envoie-t-il au retour reseau ? (1 diagnostic, pas une recette)
import { chromium } from "playwright-core";

const BASE = (process.argv[2] || "http://127.0.0.1:3101").replace(/\/+$/, "");
const nav = await chromium.launch({ channel: "msedge", headless: true });
const ctx = await nav.newContext();
const page = await ctx.newPage();

page.on("request", (r) => {
  if (r.method() === "POST" && r.url().includes("/voyageur")) {
    const ct = r.headers()["content-type"] || "";
    const b = (r.postData() || "").slice(0, 300);
    console.log(`[POST] ${r.url()} ct=${ct} body=${b.replace(/\r?\n/g, "|")}`);
  }
});
page.on("response", async (r) => {
  if (r.request().method() === "POST" && r.url().includes("/voyageur")) {
    const loc = r.headers()["location"] || "-";
    let corps = "";
    try { corps = (await r.text()).slice(0, 220).replace(/\r?\n/g, " "); } catch { corps = "(flux)"; }
    console.log(`[RESP] ${r.status()} location=${loc}`);
    console.log(`[RESP BODY] ${corps}`);
  }
});

await page.goto(`${BASE}/voyageur`, { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
const ids = await page.evaluate(() =>
  Array.from(document.querySelectorAll("input")).map((i) => i.name)
    .filter((n) => n.startsWith("$ACTION_ID")),
);
console.log("ACTION_ID dans le DOM apres hydratation:", JSON.stringify(ids));

await ctx.setOffline(true);
await page.goto(`${BASE}/voyageur`, { waitUntil: "domcontentloaded" });
const form = page.locator("form", { has: page.locator("input[name=motif]") });
await page.locator("details summary", { hasText: "incident" }).first().click();
await form.locator("select[name=qui]").selectOption("personne_03");
await form.locator("input[name=motif]").fill("diagnostic");
await form.locator("input[name=description]").fill("diagnostic");
await form.locator("button[type=submit]").click();
await page.waitForTimeout(1500);
const file = await page.evaluate(async () => new Promise((resolve) => {
  const rq = indexedDB.open("lcd-outbox", 1);
  rq.onsuccess = () => {
    const db = rq.result;
    const tx = db.transaction("ecritures", "readonly");
    const g = tx.objectStore("ecritures").getAll();
    g.onsuccess = () => resolve(g.result);
    g.onerror = () => resolve("erreur");
  };
  rq.onerror = () => resolve("pas de base");
}));
console.log("OUTBOX:", JSON.stringify(file));
const bandeau = await page.locator("[data-testid=bandeau-hors-ligne]").innerText().catch(() => "absent");
console.log("BANDEAU:", bandeau);

await ctx.setOffline(false);
await page.waitForTimeout(6000);
const apres = await page.evaluate(async () => new Promise((resolve) => {
  const rq = indexedDB.open("lcd-outbox", 1);
  rq.onsuccess = () => {
    const g = rq.result.transaction("ecritures", "readonly").objectStore("ecritures").getAll();
    g.onsuccess = () => resolve(g.result);
  };
  rq.onerror = () => resolve("?");
}));
console.log("OUTBOX APRES RETOUR:", JSON.stringify(apres));
await nav.close();

// --- Comparaison : POST NATIF sans JS (verite terrain L0-L2) ---------- //
const nav2 = await chromium.launch({ channel: "msedge", headless: true });
const ctx2 = await nav2.newContext({ javaScriptEnabled: false });
const page2 = await ctx2.newPage();
page2.on("request", (r) => {
  if (r.method() === "POST" && r.url().includes("/voyageur")) {
    const h = r.headers();
    console.log("[NATIF POST]", r.url(),
      "accept=" + (h["accept"] || "-"),
      "origin=" + (h["origin"] || "-"),
      "referer=" + (h["referer"] || "-"),
      "sec-fetch-mode=" + (h["sec-fetch-mode"] || "-"));
    console.log("[NATIF BODY]", (r.postData() || "").slice(0, 400).replace(/\r?\n/g, "|"));
  }
});
page2.on("response", (r) => {
  if (r.request().method() === "POST" && r.url().includes("/voyageur")) {
    console.log("[NATIF RESP]", r.status(), "location=" + (r.headers()["location"] || "-"));
  }
});
await page2.goto(`${BASE}/voyageur?logement=log2`, { waitUntil: "load" });
await page2.locator("details summary", { hasText: "incident" }).first().click();
const f2 = page2.locator("form", { has: page2.locator("input[name=motif]") });
await f2.locator("select[name=qui]").selectOption("personne_03");
await f2.locator("input[name=motif]").fill("natif sans js");
await f2.locator("input[name=description]").fill("natif sans js");
const repNative = await Promise.all([
  page2.waitForNavigation({ waitUntil: "load", timeout: 15000 }).catch((e) => console.log("nav:", e.message)),
  f2.locator("button[type=submit]").click(),
]).then((x) => x[0]);
console.log("[NATIF URL FINALE]", page2.url());
if (repNative) {
  const txt = await page2.locator("p[role=status]").allInnerTexts().catch(() => []);
  console.log("[NATIF P role=status]", JSON.stringify(txt));
}
// Preuve : le POST natif a-t-il EXECUTE la ref (log2 = ref fraiche) ?
await page2.waitForTimeout(1200);
const pr = await fetch("http://127.0.0.1:8443/v1/action", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    box_id: "box-lab", logement_id: "log2", action: "sinistre_declarer",
    qui: "personne_03", ref: "WEB-VOY-LOG2-sinistre_declarer",
    data: { motif: "natif sans js", description: "natif sans js" },
  }),
});
const pj = await pr.json().catch(() => ({}));
console.log("[NATIF EXECUTE ?] idempotent =", pj.idempotent,
  "premier-contact-forge =", pj.idempotent === true ? "OUI (deja vu avant nous)" : "NON (notre POST vient de l'executer)");
await nav2.close();
