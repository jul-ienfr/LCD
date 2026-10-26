import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("identité de marque : nom, logo, accent et contacts publics", async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/design");
  await page.fill('input[name="nom"]', "Marque E2E");
  await page.fill('input[name="logoUrl"]', "/icon.svg");
  await page.fill('input[name="emailContact"]', "contact@marque-e2e.test");
  await page.fill('input[name="telephoneContact"]', "+33 1 23 45 67 89");
  await page.fill('input[name="adresseContact"]', "1 rue des Tests, 75000 Paris");
  await page.getByRole("checkbox", { name: /couleur d’accent/ }).check();
  await page
    .locator('input[name="accent"]')
    .evaluate((element, valeur) => {
      const input = element as HTMLInputElement;
      input.value = valeur;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, "#1d4ed8");
  await page.getByRole("button", { name: "Enregistrer l’identité" }).click();
  await expect(page.getByText("Identité de marque enregistrée.")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--accent")
          .trim(),
      ),
    )
    .toBe("#1d4ed8");

  await page.goto("/");
  await expect(page.getByRole("link", { name: "Marque E2E" })).toBeVisible();
  await expect(page.locator('img[src="/icon.svg"]')).toBeVisible();
  await expect(
    page.getByRole("link", { name: "contact@marque-e2e.test" }),
  ).toBeVisible();
  await expect(page.getByText("+33 1 23 45 67 89")).toBeVisible();

  await page.goto("/legales");
  await expect(
    page.getByRole("link", { name: "contact@marque-e2e.test" }),
  ).toBeVisible();

  await page.goto("/hote/design");
  await page.fill('input[name="nom"]', "");
  await page.fill('input[name="logoUrl"]', "");
  await page.fill('input[name="emailContact"]', "");
  await page.fill('input[name="telephoneContact"]', "");
  await page.fill('input[name="adresseContact"]', "");
  await page.getByRole("checkbox", { name: /couleur d’accent/ }).uncheck();
  await page.getByRole("button", { name: "Enregistrer l’identité" }).click();
  await expect(page.getByText("Identité de marque enregistrée.")).toBeVisible();
  await expect(page.locator("style#identite-site")).toHaveCount(0);
});

test("design du site : 4 thèmes, bascule sans JS, retour au défaut", async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/design");
  await expect(
    page.getByRole("heading", { name: "Design du site" }),
  ).toBeVisible();
  await expect(page.locator('input[name="design"]')).toHaveCount(4);
  await expect(
    page.getByRole("heading", { name: "Thème actif" }),
  ).toBeVisible();

  await page.locator('input[name="design"][value="ocean"]').check();
  await page.getByRole("button", { name: "Appliquer ce design" }).click();
  await expect(page.getByText("Design appliqué : Océan.")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--accent")
          .trim(),
      ),
    )
    .toBe("#1d4ed8");

  await page.goto("/hote");
  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--accent")
          .trim(),
      ),
    )
    .toBe("#1d4ed8");

  await page.goto("/hote/design");
  await page.locator('input[name="design"][value="sejour"]').check();
  await page.getByRole("button", { name: "Appliquer ce design" }).click();
  await expect(page.getByText("Design appliqué : Séjour.")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--accent")
          .trim(),
      ),
    )
    .toBe("#0e7c6b");
});
