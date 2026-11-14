import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const base = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const email = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const motDePasse = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";
const routes = (
  process.env.AUDIT_PAGES ??
  "/hote,/hote/planning,/hote/logements,/hote/messages,/hote/utilisateurs"
)
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);
const viewport = {
  width: Number(process.env.AUDIT_WIDTH ?? 1280),
  height: Number(process.env.AUDIT_HEIGHT ?? 900),
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport });
const page = await context.newPage();
await page.goto(`${base}/login`, { waitUntil: "load" });
await page.fill('input[name="email"]', email);
await page.fill('input[name="password"]', motDePasse);
await page.click('button[type="submit"]');
await page.waitForURL(/\/hote/, { timeout: 20000 });

const resultats = [];
for (const route of routes) {
  const reponse = await page.goto(`${base}${route}`, {
    waitUntil: "load",
    timeout: 30000,
  });
  await page.waitForTimeout(300);
  const analyse = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const debordement = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  resultats.push({
    route,
    statut: reponse?.status() ?? null,
    debordement,
    violations: analyse.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
      targets: violation.nodes.slice(0, 4).map((node) => node.target.join(" ")),
      details: violation.nodes.slice(0, 4).map((node) => ({
        target: node.target.join(" "),
        html: node.html.slice(0, 160),
        data: node.any?.[0]?.data ?? null,
      })),
    })),
  });
  console.log(
    `${route} → ${analyse.violations.length} violation(s)${debordement ? " + débordement" : ""}`,
  );
}
writeFileSync(
  process.env.AUDIT_OUT_FILE ?? ".artifacts/ergonomie/staff-axe.json",
  `${JSON.stringify({ viewport, resultats }, null, 2)}\n`,
);
await browser.close();
