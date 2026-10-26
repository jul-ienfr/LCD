import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

async function connexion(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);
}

test("sécurité : sessions actives et fermeture des autres", async ({
  browser,
}) => {
  test.setTimeout(60_000);

  const contexteA = await browser.newContext();
  const contexteB = await browser.newContext();
  const pageA = await contexteA.newPage();
  const pageB = await contexteB.newPage();

  await connexion(pageA);
  await connexion(pageB);

  await pageA.goto("/hote/securite");
  await expect(pageA.getByText("Session actuelle")).toBeVisible();
  const premiereSession = pageA
    .locator("section", { hasText: "Sessions actives" })
    .locator("li")
    .first();
  await expect(premiereSession).toContainText("Session actuelle");
  await expect(
    pageA.getByRole("button", { name: "Fermer les autres sessions" }),
  ).toBeEnabled();

  await pageA
    .getByRole("button", { name: "Fermer les autres sessions" })
    .click();
  await expect(
    pageA.getByText("Les autres sessions ont été fermées."),
  ).toBeVisible();

  await pageB.goto("/hote");
  await expect(pageB).toHaveURL(/\/login$/);

  await pageA.goto("/hote");
  await expect(pageA).toHaveURL(/\/hote$/);

  await contexteA.close();
  await contexteB.close();
});
