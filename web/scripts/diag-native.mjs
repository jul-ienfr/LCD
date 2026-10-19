import { chromium } from "playwright-core";
const BASE = (process.argv[2] || "http://127.0.0.1:3101").replace(/\/+$/, "");
const nav = await chromium.launch({ channel: "msedge", headless: true });
const ctx = await nav.newContext({ javaScriptEnabled: false });
const page = await ctx.newPage();
page.on("response", (r) => {
  if (r.request().method() === "POST" && r.url().includes("/presta")) {
    console.log("[NATIF PRESTA RESP]", r.status(), "loc=" + (r.headers()["location"] || "-"));
  }
});
await page.goto(`${BASE}/presta`, { waitUntil: "load" });
await page.locator("details summary", { hasText: "mission" }).first().click();
const f = page.locator("form", { has: page.locator("input[name=presta_id]") });
await f.locator("select[name=qui]").selectOption("personne_03");
await f.locator("input[name=presta_id]").fill("lab_menage_01");
await f.locator("input[name=motif]").fill("Magenage natif test");
await Promise.all([
  page.waitForNavigation({ waitUntil: "load", timeout: 15000 }).catch((e) => console.log("nav KO:", e.message)),
  f.locator("button[type=submit]").click(),
]);
console.log("[NATIF URL]", page.url());
const st = await page.locator("p[role=status]").allInnerTexts().catch(() => []);
console.log("[NATIF STATUT]", JSON.stringify(st));
await nav.close();
await new Promise((r) => setTimeout(r, 1500));
const pr = await fetch("http://127.0.0.1:8443/v1/action", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ box_id: "box-lab", logement_id: "log1", action: "mission", qui: "personne_03", ref: "WEB-PRESTA-mission", data: { presta_id: "lab_menage_01", motif: "Magenage natif test" } }),
});
console.log("[PREUVE]", pr.status, await pr.text());