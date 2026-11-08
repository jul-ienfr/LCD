import { expect, test } from "@playwright/test";

const email = process.env.SEED_ADMIN_EMAIL ?? "";
const motDePasse = process.env.SEED_ADMIN_PASSWORD ?? "";

test.skip(!email || !motDePasse, "SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD absents.");

const PUBLIQUES = [
  "/",
  "/aide",
  "/legales",
  "/design",
  "/login",
  "/mot-de-passe-oublie",
  "/offline",
  "/api/health",
  "/api/ready",
];

const STAFF = [
  "/hote",
  "/hote/acces",
  "/hote/annonce",
  "/hote/assistant",
  "/hote/audit",
  "/hote/avis",
  "/hote/cautions",
  "/hote/compta",
  "/hote/compta/parametres",
  "/hote/compta/rapprochement",
  "/hote/design",
  "/hote/dispatch",
  "/hote/entite",
  "/hote/entretien",
  "/hote/etats-des-lieux",
  "/hote/extras",
  "/hote/factures",
  "/hote/formation",
  "/hote/integrations",
  "/hote/inventaire",
  "/hote/logements",
  "/hote/menage",
  "/hote/messages",
  "/hote/missions",
  "/hote/objets-trouves",
  "/hote/onboarding",
  "/hote/phrases",
  "/hote/planning",
  "/hote/planning/import",
  "/hote/police",
  "/hote/prix",
  "/hote/proprietaires",
  "/hote/questionnaires",
  "/hote/recherche",
  "/hote/rgpd",
  "/hote/securite",
  "/hote/sinistres",
  "/hote/stocks",
  "/hote/tourisme",
  "/hote/tranquillite",
  "/hote/utilisateurs",
  "/journal",
  "/secrets",
  "/systeme",
  "/supervision",
  "/supervision/apparence",
  "/supervision/voir-comme",
];

async function verifier(page: import("@playwright/test").Page, routes: string[]) {
  const echecs: string[] = [];
  for (const route of routes) {
    const reponse = await page.goto(route, { waitUntil: "domcontentloaded" });
    const statut = reponse?.status() ?? 0;
    if (statut >= 400) {
      echecs.push(`${route} → HTTP ${statut}`);
      continue;
    }
    const titre = await page.title();
    const corps = await page.locator("body").innerText();
    if (/Internal Error|Application Error|500/i.test(titre) || /Internal Error/i.test(corps)) {
      echecs.push(`${route} → erreur serveur`);
    }
  }
  expect(echecs, echecs.join("\n")).toEqual([]);
}

test("les routes publiques répondent sans erreur", async ({ page }) => {
  test.setTimeout(120_000);
  await verifier(page, PUBLIQUES);
});

test("les routes staff répondent sans erreur", async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', motDePasse);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote/);
  await verifier(page, STAFF);
});
