import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";
const PROPRIO_EMAIL = process.env.SEED_PROPRIO_EMAIL ?? "proprio@lcd.test";
const PROPRIO_PASSWORD =
  process.env.SEED_PROPRIO_PASSWORD ?? "ChangeMe-2026!";

test("propriétaire : rattachement, relevé et isolation", async ({
  page,
  browser,
}) => {
  const suffix = Date.now();
  const codeA = `pro-a-${suffix}`;
  const nomA = `Proprio A ${suffix}`;
  const codeB = `pro-b-${suffix}`;
  const nomB = `Proprio B ${suffix}`;
  const refResa = `resa-pro-${suffix}`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  for (const [code, nom] of [
    [codeA, nomA],
    [codeB, nomB],
  ] as const) {
    await page.goto("/hote/logements");
    await page.fill('input[name="code"]', code);
    await page.fill('input[name="nom"]', nom);
    await page.getByRole("button", { name: "Créer le logement" }).click();
    await expect(page.getByText(`Logement « ${code} » créé.`)).toBeVisible();
  }

  await page.goto("/hote/planning?mois=2026-12");
  await page.selectOption('select[name="logement"]', { label: nomA });
  await page.getByRole("button", { name: "Afficher" }).click();
  await page.fill('input[name="ref"]', refResa);
  await page.fill('input[name="clientNom"]', "Client Proprio");
  await page.fill('input[name="debut"]', "2026-12-10");
  await page.fill('input[name="fin"]', "2026-12-14");
  await page.fill('input[name="montantEuros"]', "800");
  await page.getByRole("button", { name: "Créer la réservation" }).click();
  await expect(page.getByText(`Réservation ${refResa} créée`)).toBeVisible();

  // Entité juridique utilisée sur les factures.
  await page.goto("/hote/entite");
  await page.fill('input[name="siren"]', "123456789");
  await page.selectOption('select[name="nature"]', "sarl");
  await page.selectOption('select[name="regime"]', "reel_simplifie");
  await page.selectOption('select[name="tva"]', "reelle");
  await page.fill(
    'textarea[name="adresse"]',
    "12 rue des Lilas, 75011 Paris",
  );
  await page.fill(
    'textarea[name="mentionsLegales"]',
    "TVA acquittée sur les encaissements.",
  );
  await page.getByRole("button", { name: /Enregistrer l/ }).click();
  await expect(
    page.getByText("Entité juridique mise à jour."),
  ).toBeVisible();
  await expect(page.getByText("123456789", { exact: true })).toBeVisible();

  await page.goto("/hote/proprietaires");
  await page.selectOption('select[name="userId"]', {
    label: `Propriétaire LCD (${PROPRIO_EMAIL})`,
  });
  await page.selectOption('select[name="logementId"]', {
    label: `${nomA} (${codeA})`,
  });
  await page.fill('input[name="commission"]', "20");
  await page.selectOption('select[name="mode"]', "mandat_tiers");
  await page.selectOption('select[name="statut"]', "actif");
  await page.fill('input[name="dateDebut"]', "2026-01-01");
  await page.fill('input[name="dateFin"]', "2026-12-31");
  await page.fill('textarea[name="notes"]', "Mandat E2E");
  await page.getByRole("button", { name: "Enregistrer le mandat" }).click();
  await expect(
    page.getByText(`Propriétaire LCD est rattaché à ${nomA}`, {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page
      .locator("li")
      .filter({ hasText: nomA })
      .getByText("Mandat tiers", { exact: false }),
  ).toBeVisible();

  const contexteProprio = await browser.newContext();
  const pageProprio = await contexteProprio.newPage();
  await pageProprio.goto("/login");
  await pageProprio.fill('input[type="email"]', PROPRIO_EMAIL);
  await pageProprio.fill('input[type="password"]', PROPRIO_PASSWORD);
  await pageProprio.getByRole("button", { name: "Se connecter" }).click();
  await expect(pageProprio).toHaveURL(/\/proprio$/);

  await pageProprio.goto("/proprio?mois=2026-12");
  await expect(pageProprio.getByText(nomA).first()).toBeVisible();
  await expect(pageProprio.getByText(refResa).first()).toBeVisible();
  const ligneA = pageProprio.locator("tr").filter({ hasText: nomA }).first();
  await expect(ligneA).toContainText("800,00 €");
  await expect(ligneA).toContainText("160,00 €");
  await expect(ligneA).toContainText("640,00 €");
  await expect(pageProprio.getByText(nomB)).toHaveCount(0);

  await contexteProprio.close();
});
