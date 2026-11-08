import { expect, test } from "@playwright/test";

const email = process.env.SEED_SUPER_ADMIN_EMAIL ?? "super@lcd.test";
const motDePasse =
  process.env.SEED_SUPER_ADMIN_PASSWORD ??
  process.env.SEED_ADMIN_PASSWORD ??
  "";

test.skip(
  !email || !motDePasse,
  "SEED_SUPER_ADMIN_EMAIL / SEED_SUPER_ADMIN_PASSWORD absents de .env.local",
);

async function connexion(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', motDePasse);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote/);
}

async function publierIdentite(
  page: import("@playwright/test").Page,
  identite: {
    nom: string;
    logoUrl: string;
    emailContact: string;
    telephoneContact: string;
    adresseContact: string;
  },
) {
  await page.goto("/supervision/apparence");
  await page.fill('input[name="nom"]', identite.nom);
  await page.fill('input[name="logoUrl"]', identite.logoUrl);
  await page.fill('input[name="emailContact"]', identite.emailContact);
  await page.fill('input[name="telephoneContact"]', identite.telephoneContact);
  await page.fill('input[name="adresseContact"]', identite.adresseContact);
  await page
    .getByRole("button", { name: "Enregistrer le brouillon" })
    .click();
  await expect(page.getByRole("status")).toContainText("Brouillon enregistré");
  await page.waitForLoadState("networkidle");

  await page
    .getByPlaceholder("Ex. passage au thème Sable pour l’été")
    .fill("E2E identité de marque");
  await page.getByRole("button", { name: "Publier pour tout le site" }).click();
  await expect(page.getByRole("status")).toContainText("publiée pour tout le site");
  await page.waitForLoadState("networkidle");
}

test("identité de marque : nom, logo et contacts publics", async ({ page }) => {
  await connexion(page);

  await publierIdentite(page, {
    nom: "Marque E2E",
    logoUrl: "/icon.svg",
    emailContact: "contact@marque-e2e.test",
    telephoneContact: "+33 1 23 45 67 89",
    adresseContact: "1 rue des Tests, 75000 Paris",
  });

  await page.goto("/");
  await expect(page).toHaveTitle(/^Marque E2E/);
  await expect(
    page.getByRole("link", { name: "Marque E2E" }).first(),
  ).toBeVisible();
  await expect(
    page.locator('img[src="/icon.svg"]').first(),
  ).toHaveAttribute("src", "/icon.svg");
  await expect(
    page.getByRole("link", { name: "contact@marque-e2e.test" }),
  ).toBeVisible();

  await page.goto("/legales");
  await expect(
    page.getByRole("link", { name: "contact@marque-e2e.test" }),
  ).toBeVisible();

  await publierIdentite(page, {
    nom: "",
    logoUrl: "",
    emailContact: "",
    telephoneContact: "",
    adresseContact: "",
  });

  await page.goto("/");
  await expect(page.locator('img[src="/icon.svg"]')).toHaveCount(0);
});

test("apparence : les thèmes globaux sont au complet", async ({ page }) => {
  await connexion(page);
  await page.goto("/supervision/apparence");

  await expect(
    page.getByRole("heading", { level: 2, name: "1. Choisir un thème" }),
  ).toBeVisible();
  await expect(page.locator('input[name="themeId"]')).toHaveCount(6);
  await expect(page.locator('input[name="accentActif"]')).toHaveCount(1);
  await expect(page.locator('input[name="logoUrl"]')).toHaveCount(1);
  await expect(
    page.getByRole("heading", { level: 2, name: "3. Publier" }),
  ).toBeVisible();
});
