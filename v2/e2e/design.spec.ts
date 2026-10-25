import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

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
  await expect(page.getByText("Thème actif")).toBeVisible();

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
