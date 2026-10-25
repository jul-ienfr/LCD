import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("intégrations : créer, valider et supprimer un webhook", async ({
  page,
}) => {
  const suffix = Date.now();
  const libelle = `HA E2E ${suffix}`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/integrations");
  await page.fill('input[name="libelle"]', libelle);
  await page.fill('input[name="url"]', "https://ha.example.com/api/webhook/lcd");
  await page.getByRole("button", { name: "Enregistrer le webhook" }).click();
  await expect(
    page.getByText(`Webhook « ${libelle} » enregistré.`),
  ).toBeVisible();

  const ligne = page.locator("li").filter({ hasText: libelle }).first();
  await expect(ligne).toContainText("https://ha.example.com/api/webhook/lcd");
  await expect(ligne).toContainText("Réservation créée");

  // URL non HTTPS refusée.
  await page.fill('input[name="libelle"]', "Bad webhook");
  await page.fill('input[name="url"]', "http://localhost/hook");
  await page.fill('input[name="secret"]', "0123456789abcdef");
  await page.getByRole("button", { name: "Enregistrer le webhook" }).click();
  await expect(
    page.getByText("URL webhook invalide", { exact: false }),
  ).toBeVisible();

  // Suppression.
  const ligneASupprimer = page.locator("li").filter({ hasText: libelle }).first();
  await ligneASupprimer.getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByText(libelle)).toHaveCount(0);
});
