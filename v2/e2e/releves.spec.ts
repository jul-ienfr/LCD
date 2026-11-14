import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";
const PROPRIO_EMAIL = process.env.SEED_PROPRIO_EMAIL ?? "proprio@lcd.test";
const PROPRIO_PASSWORD =
  process.env.SEED_PROPRIO_PASSWORD ?? "ChangeMe-2026!";
const CRON_SECRET = process.env.CRON_SECRET ?? "local-test-cron-secret-2026";

test("relevés : génération cron, consultation portail, téléchargement PDF", async ({
  page,
  browser,
}) => {
  test.setTimeout(90_000);
  const suffix = Date.now();
  const code = `rel-${suffix}`;
  const nom = `Relevé ${suffix}`;
  const refResa = `resa-rel-${suffix}`;

  // --- Admin : seed logement + réservation + mandat ---
  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  // Créer le logement
  await page.goto("/hote/logements", { waitUntil: "domcontentloaded" });
  await page.fill('input[name="code"]', code);
  await page.fill('input[name="nom"]', nom);
  await page.getByRole("button", { name: "Créer le logement" }).click();
  await expect(page.getByText(`Logement « ${code} » créé.`)).toBeVisible();

  // Créer une réservation en novembre 2026
  await page.goto("/hote/planning?mois=2026-11", { waitUntil: "domcontentloaded" });
  await page.selectOption('select[name="logement"]', { label: nom });
  await page.getByRole("button", { name: "Afficher" }).click();
  await page.fill('input[name="ref"]', refResa);
  await page.fill('input[name="clientNom"]', "Client Relevé");
  await page.fill('input[name="debut"]', "2026-11-10");
  await page.fill('input[name="fin"]', "2026-11-14");
  await page.fill('input[name="montantEuros"]', "600");
  await page.getByRole("button", { name: "Créer la réservation" }).click();
  await expect(page.getByText(`Réservation ${refResa} créée`)).toBeVisible();

  // Créer le mandat
  await page.goto("/hote/proprietaires", { waitUntil: "domcontentloaded" });
  await page.selectOption('select[name="userId"]', {
    label: `Propriétaire LCD (${PROPRIO_EMAIL})`,
  });
  await page.selectOption('select[name="logementId"]', {
    label: `${nom} (${code})`,
  });
  await page.fill('input[name="commission"]', "20");
  await page.selectOption('select[name="mode"]', "mandat_tiers");
  await page.selectOption('select[name="statut"]', "actif");
  await page.fill('input[name="dateDebut"]', "2026-01-01");
  await page.fill('input[name="dateFin"]', "2026-12-31");
  await page.fill('textarea[name="notes"]', "Mandat E2E relevés");
  await page.getByRole("button", { name: "Enregistrer le mandat" }).click();
  await expect(
    page.getByText(`Propriétaire LCD est rattaché à ${nom}`, { exact: false }),
  ).toBeVisible();

  // --- Cron : générer les relevés du 2026-12-01 (mensuel novembre 2026) ---
  const reponse = await page.request.get(
    "/api/cron/releves?date=2026-12-01",
    {
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    },
  );
  expect(reponse.status()).toBe(200);
  const corps = await reponse.json();
  expect(corps.ok).toBe(true);

  // --- Proprio : consulter le portail des relevés archivés ---
  const contexteProprio = await browser.newContext();
  const pageProprio = await contexteProprio.newPage();
  await pageProprio.goto("/login");
  await pageProprio.fill('input[type="email"]', PROPRIO_EMAIL);
  await pageProprio.fill('input[type="password"]', PROPRIO_PASSWORD);
  await pageProprio.getByRole("button", { name: "Se connecter" }).click();
  await expect(pageProprio).toHaveURL(/\/proprio$/);

  // Naviguer vers les relevés archivés
  await pageProprio.goto("/proprio/releves", { waitUntil: "domcontentloaded" });
  // Le relevé mensuel de novembre 2026 doit apparaître
  await expect(pageProprio.getByText("novembre 2026").first()).toBeVisible();
  await expect(pageProprio.getByText("mensuel").first()).toBeVisible();

  // Télécharger le PDF
  const lienPdf = pageProprio.getByRole("link", { name: "PDF" }).first();
  await expect(lienPdf).toBeVisible();
  const hrefPdf = await lienPdf.getAttribute("href");
  expect(hrefPdf).toBeTruthy();

  const reponsePdf = await pageProprio.request.get(hrefPdf!);
  expect(reponsePdf.status()).toBe(200);
  expect(reponsePdf.headers()["content-type"]).toContain("application/pdf");

  await contexteProprio.close();
});
