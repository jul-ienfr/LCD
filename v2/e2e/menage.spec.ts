import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("ménage : planification, checklist et réassort au départ", async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `men-e2e-${suffix}`;
  const nomLogement = `Logement Ménage E2E ${suffix}`;
  const codeConso = `savon-${suffix}`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/logements");
  await page.fill('input[name="code"]', code);
  await page.fill('input[name="nom"]', nomLogement);
  await page.getByRole("button", { name: "Créer le logement" }).click();
  await expect(page.getByText(`Logement « ${code} » créé.`)).toBeVisible();

  await page.goto("/hote/stocks");
  await page.getByRole("link", { name: nomLogement, exact: true }).click();
  await page.waitForURL(/logement=/);
  const logementId = new URL(page.url()).searchParams.get("logement");
  expect(logementId).toBeTruthy();

  await page.fill('input[name="code"]', codeConso);
  await page.fill('input[name="label"]', "Savon");
  await page.fill('input[name="stock"]', "10");
  await page.fill('input[name="unite"]', "unité");
  await page.fill('input[name="seuil"]', "2");
  await page.fill('input[name="cible"]', "10");
  await page.fill('input[name="consoRotation"]', "1");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByText("Consommable enregistré.")).toBeVisible();

  await page.goto("/hote/menage");
  await page.getByRole("link", { name: nomLogement, exact: true }).click();
  await page.waitForURL(/logement=/);
  await page.getByRole("button", { name: "Planifier le ménage" }).click();

  await expect(page).toHaveURL(/\/hote\/menage\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name: /Ménage —/ })).toBeVisible();

  const cases = page.locator('form input[type="checkbox"]');
  const nombre = await cases.count();
  expect(nombre).toBeGreaterThan(0);
  for (let index = 0; index < nombre; index += 1) {
    await cases.nth(index).check();
  }

  await page.selectOption('select[name="statut"]', "fait");
  await page.getByRole("button", { name: "Enregistrer le ménage" }).click();
  await expect(page.getByText("Ménage enregistré.")).toBeVisible();
  await expect(
    page.getByText(new RegExp(`Fait.*${nombre} / ${nombre}`)),
  ).toBeVisible();

  await page.selectOption('select[name="score"]', "4");
  await page.fill('input[name="coutEuros"]', "45");
  await page.fill('input[name="dureeMinutes"]', "90");
  await page.getByRole("button", { name: "Enregistrer l’évaluation" }).click();
  await expect(page.getByText("Évaluation enregistrée.")).toBeVisible();

  await page.goto(`/hote/menage?logement=${logementId}`);
  await expect(page.getByText("4.0 / 5")).toBeVisible();
  await expect(page.getByText(/45,00/).first()).toBeVisible();
  await expect(page.getByText("90 min").first()).toBeVisible();

  await page.goto(`/hote/stocks?logement=${logementId}`);
  const ligne = page.locator("tbody tr").filter({ hasText: codeConso });
  await expect(ligne).toContainText("9 unité");
});
