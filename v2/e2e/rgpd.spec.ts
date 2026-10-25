import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

const CODES = [
  "reservations",
  "facturation",
  "support",
  "avis",
  "memoire",
  "objets_trouves",
  "tranquillite",
];

test("registre RGPD : complétude, persistance et traitement désactivé", async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/rgpd");
  await expect(
    page.getByRole("heading", { name: "Registre RGPD" }),
  ).toBeVisible();

  for (const code of CODES) {
    await page.locator(`input[name="actif-${code}"]`).check();
    await page.locator(`input[name="duree-${code}"]`).fill("24");
  }
  await page.fill('input[name="dpoNom"]', "Camille Martin");
  await page.fill('input[name="dpoContact"]', "dpo@lcd.test");
  await page.fill('input[name="hebergement"]', "Union européenne — Paris");
  await page.getByRole("button", { name: "Enregistrer le registre" }).click();

  await expect(page.getByText("Registre enregistré.")).toBeVisible();
  await expect(
    page.getByText("7 / 7 traitements actifs documentés · 100 %"),
  ).toBeVisible();
  await expect(page.getByText("Registre complet")).toBeVisible();

  await page.reload();
  await expect(page.locator('input[name="dpoContact"]')).toHaveValue(
    "dpo@lcd.test",
  );
  await expect(page.locator('input[name="duree-avis"]')).toHaveValue("24");
  await expect(page.getByText("Registre complet")).toBeVisible();

  await page.locator('input[name="actif-avis"]').uncheck();
  await page.getByRole("button", { name: "Enregistrer le registre" }).click();
  await expect(page.getByText("Registre enregistré.")).toBeVisible();
  await expect(
    page.getByText("6 / 6 traitements actifs documentés · 100 %"),
  ).toBeVisible();

  await page.fill('input[name="dpoContact"]', "");
  await page.getByRole("button", { name: "Enregistrer le registre" }).click();
  await expect(page.getByText("Registre enregistré.")).toBeVisible();
  await expect(page.getByText("À compléter")).toBeVisible();

  await page.fill('input[name="dpoContact"]', "dpo@lcd.test");
  await page.locator('input[name="actif-avis"]').check();
  await page.getByRole("button", { name: "Enregistrer le registre" }).click();
  await expect(page.getByText("Registre complet")).toBeVisible();
});
