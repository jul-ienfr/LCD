import { expect, test } from "@playwright/test";

test("mode léger : activation par cookie, styles allégés et retour", async ({
  page,
  context,
}) => {
  await context.clearCookies();
  await page.goto("/api/lite?on=1&retour=/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Version légère active.")).toBeVisible();
  await expect(page.locator(".apparence.mode-lite")).toHaveCount(1);

  await page.getByRole("link", { name: "Revenir à la version complète" }).click();
  await expect(page.getByText("Version légère active.")).toBeHidden();
  await expect(page.locator(".apparence.mode-lite")).toHaveCount(0);
});
