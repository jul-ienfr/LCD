import { expect, test } from "@playwright/test";

test("bandeau cookies : information, acquittement et persistance", async ({
  page,
  context,
}) => {
  await context.clearCookies();
  await page.goto("/");
  const bandeau = page.getByRole("region", { name: "Information sur les cookies" });
  await expect(bandeau).toBeVisible();
  await expect(bandeau.getByText("cookies essentiels")).toBeVisible();

  await page.getByRole("link", { name: "J’ai compris" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(bandeau).toBeHidden();

  await page.reload();
  await expect(bandeau).toBeHidden();
});
