import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("accès : registre nominatif, session courante protégée et révocation", async ({
  page,
  browser,
}) => {
  const suffix = Date.now();
  const nomHote = `Hôte Accès ${suffix}`;
  const emailHote = `acces-${suffix}@lcd.test`;
  const motDePasse = `Provisoire-${suffix}!`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/utilisateurs");
  await page.fill('input[name="name"]', nomHote);
  await page.fill('input[name="email"]', emailHote);
  await page.selectOption('select[name="role"]', "hote");
  await page.fill('input[name="password"]', motDePasse);
  await page.getByRole("button", { name: "Créer le compte" }).click();
  await expect(page.getByText(`Compte créé pour ${emailHote}.`)).toBeVisible();

  const contexteHote = await browser.newContext();
  const pageHote = await contexteHote.newPage();
  await pageHote.goto("/login");
  await pageHote.fill('input[type="email"]', emailHote);
  await pageHote.fill('input[type="password"]', motDePasse);
  await pageHote.getByRole("button", { name: "Se connecter" }).click();
  await expect(pageHote).toHaveURL(/\/hote$/);

  await page.goto("/hote/acces");
  await expect(page.getByText("Registre des accès")).toBeVisible();
  await expect(page.getByText("Session courante").first()).toBeVisible();

  const ligneHote = page
    .locator("tbody tr")
    .filter({ hasText: emailHote })
    .first();
  await expect(ligneHote.getByText("Active")).toBeVisible();
  await ligneHote.getByRole("button", { name: "Révoquer" }).click();
  await expect(page.getByText("Session révoquée.")).toBeVisible();
  await expect(
    page.locator("tbody tr").filter({ hasText: emailHote }),
  ).toHaveCount(0);

  await pageHote.goto("/hote");
  await expect(pageHote).toHaveURL(/\/login/);
  await contexteHote.close();

  await page.goto("/hote/acces");
  await expect(page.getByText("Session courante").first()).toBeVisible();
});
