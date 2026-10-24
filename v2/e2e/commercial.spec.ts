import { expect, test } from "@playwright/test";

const COMMERCIAL_EMAIL =
  process.env.SEED_COMMERCIAL_EMAIL ?? "commercial@lcd.test";
const COMMERCIAL_PASSWORD =
  process.env.SEED_COMMERCIAL_PASSWORD ?? "ChangeMe-2026!";

test("commercial : prospect, pipeline et offre", async ({ page }) => {
  const suffix = Date.now();
  const nom = `Prospect E2E ${suffix}`;
  const email = `prospect-${suffix}@example.com`;
  const titre = `Forfait FULL ${suffix}`;

  await page.goto("/login");
  await page.fill('input[type="email"]', COMMERCIAL_EMAIL);
  await page.fill('input[type="password"]', COMMERCIAL_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/commercial$/);

  await page.fill('input[name="nom"]', nom);
  await page.fill('input[name="email"]', email);
  await page.selectOption('select[name="source"]', "site");
  await page.getByRole("button", { name: "Créer le prospect" }).click();
  await expect(page.getByText(`Prospect ${nom} créé.`)).toBeVisible();
  await expect(page.getByText(nom).first()).toBeVisible();

  await page.getByRole("link", { name: new RegExp(nom) }).click();
  await expect(page).toHaveURL(/\/commercial\/prospects\/[0-9a-f-]+$/);

  await page.getByRole("button", { name: "Qualifier" }).click();
  await expect(page.getByText("qualifie").first()).toBeVisible();

  await page.fill('input[name="titre"]', titre);
  await page.fill('input[name="montantEuros"]', "149");
  await page.getByRole("button", { name: "Créer l’offre" }).click();
  await expect(page.getByText(`Offre « ${titre} » créée.`)).toBeVisible();
  await expect(page.getByText(titre).first()).toBeVisible();

  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByText("envoyee").first()).toBeVisible();
  await page.getByRole("button", { name: "Accepter" }).click();
  await expect(page.getByText("acceptee").first()).toBeVisible();
});
