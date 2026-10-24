import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("guide logement + extra commandé par le voyageur", async ({
  page,
  browser,
}) => {
  const suffix = Date.now();
  const code = `gui-e2e-${suffix}`;
  const nom = `Guide E2E ${suffix}`;
  const wifi = `WiFi-E2E-${suffix}`;
  const extraNom = `Petit déj ${suffix}`;
  const extraCode = `extra-${suffix}`;
  const refResa = `resa-gui-${suffix}`;

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

  const ligneLogement = page
    .locator("li")
    .filter({ hasText: nom })
    .first();
  await ligneLogement.getByRole("link", { name: "Guide" }).click();
  await page.fill('input[name="checkinHeure"]', "15:00");
  await page.fill('input[name="wifiSsid"]', wifi);
  await page.fill('input[name="wifiPassword"]', "motdepasse-e2e");
  await page.fill(
    'textarea[name="checkinInstructions"]',
    "Boîte à clés à gauche de la porte.",
  );
  await page.getByRole("button", { name: "Enregistrer le guide" }).click();
  await expect(page.getByText("Guide du logement enregistré.")).toBeVisible();

  await page.goto("/hote/extras");
  await page.fill('input[name="code"]', extraCode);
  await page.fill('input[name="nom"]', extraNom);
  await page.fill('input[name="prixEuros"]', "12.50");
  await page.fill('textarea[name="description"]', "Viennoiseries et jus.");
  await page.getByRole("button", { name: "Créer l’extra" }).click();
  await expect(page.getByText(`Extra « ${extraNom} » créé.`)).toBeVisible();

  await page.goto("/hote/planning?mois=2026-12");
  await page.selectOption('select[name="logement"]', { label: nom });
  await page.getByRole("button", { name: "Afficher" }).click();
  await page.fill('input[name="ref"]', refResa);
  await page.fill('input[name="clientNom"]', "Voyageur Guide");
  await page.fill('input[name="debut"]', "2026-12-20");
  await page.fill('input[name="fin"]', "2026-12-23");
  await page.fill('input[name="montantEuros"]', "600");
  await page.getByRole("button", { name: "Créer la réservation" }).click();
  await expect(page.getByText(`Réservation ${refResa} créée`)).toBeVisible();

  const sectionResa = page
    .locator("section")
    .filter({ hasText: "Réservations du mois" });
  const ligneResa = sectionResa
    .locator("li")
    .filter({ hasText: refResa })
    .first();
  const href = await ligneResa
    .getByRole("link", { name: "Lien voyageur" })
    .getAttribute("href");
  expect(href).toContain("/voyageur?t=");

  const noJs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(href ?? "/voyageur");
  await expect(noJsPage.getByText(wifi)).toBeVisible();
  await expect(noJsPage.getByText("15:00")).toBeVisible();

  const sectionExtras = noJsPage
    .locator("section")
    .filter({ hasText: "Extras" });
  const ligneExtra = sectionExtras
    .locator("li")
    .filter({ hasText: extraNom })
    .first();
  await ligneExtra.locator('input[name="quantite"]').fill("2");
  await ligneExtra.getByRole("button", { name: "Commander" }).click();
  await expect(noJsPage.getByText("Commande enregistrée.")).toBeVisible();
  await expect(noJsPage.getByText(extraNom).first()).toBeVisible();
  await noJs.close();

  await page.goto("/hote/extras");
  await expect(page.getByText(extraNom).first()).toBeVisible();
});
