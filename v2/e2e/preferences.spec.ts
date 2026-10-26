import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("préférences séjour : formulaire no-JS, enregistrement et relecture", async ({
  page,
  browser,
}) => {
  const suffix = Date.now();
  const code = `pref-e2e-${suffix}`;
  const nom = `Préférences E2E ${suffix}`;
  const refResa = `resa-pref-${suffix}`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/logements");
  await page.fill('input[name="code"]', code);
  await page.fill('input[name="nom"]', nom);
  await page.getByRole("button", { name: "Créer le logement" }).click();
  await expect(page.getByText(`Logement « ${code} » créé.`)).toBeVisible();

  await page.goto("/hote/planning?mois=2026-12");
  await page.selectOption('select[name="logement"]', { label: nom });
  await page.getByRole("button", { name: "Afficher" }).click();
  await page.fill('input[name="ref"]', refResa);
  await page.fill('input[name="clientNom"]', "Voyageur Préférences");
  await page.fill('input[name="debut"]', "2026-12-10");
  await page.fill('input[name="fin"]', "2026-12-14");
  await page.fill('input[name="montantEuros"]', "600");
  await page.getByRole("button", { name: "Créer la réservation" }).click();
  await expect(page.getByText(`Réservation ${refResa} créée`)).toBeVisible();

  const ligne = page
    .locator("section")
    .filter({ hasText: "Réservations du mois" })
    .locator("li")
    .filter({ hasText: refResa })
    .first();
  const href = await ligne
    .getByRole("link", { name: "Lien voyageur" })
    .getAttribute("href");
  expect(href).toContain("/voyageur?t=");

  const noJs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 800 },
  });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(href ?? "/voyageur");
  await expect(noJsPage.getByText("Préférences de séjour")).toBeVisible();

  await noJsPage.fill('input[name="menageFrequenceJ"]', "7");
  await noJsPage.fill('input[name="heureArrivee"]', "18:30");
  await noJsPage.fill(
    'textarea[name="consignes"]',
    "Lit bébé dans la chambre, merci.",
  );
  await noJsPage
    .getByRole("button", { name: "Enregistrer mes préférences" })
    .click();
  await expect(noJsPage.getByText("Préférences enregistrées.")).toBeVisible();

  await noJsPage.reload();
  await expect(noJsPage.locator('input[name="menageFrequenceJ"]')).toHaveValue(
    "7",
  );
  await expect(noJsPage.locator('input[name="heureArrivee"]')).toHaveValue(
    "18:30",
  );
  await expect(noJsPage.locator('textarea[name="consignes"]')).toHaveValue(
    "Lit bébé dans la chambre, merci.",
  );
  await noJs.close();
});
