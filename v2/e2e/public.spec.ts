import { expect, test } from "@playwright/test";

test.describe("pages publiques sans JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("aide : rôles, espaces et limites consultables", async ({ page }) => {
    await page.goto("/aide");
    await expect(
      page.getByRole("heading", { level: 1, name: /Comment fonctionne/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Administrateur", exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Mentions légales" })).toBeVisible();
    await expect(
      page.getByText(/Aucun encaissement de carte bancaire/),
    ).toBeVisible();
  });

  test("légales : éditeur réel ou marqué à compléter", async ({ page }) => {
    await page.goto("/legales");
    await expect(
      page.getByRole("heading", { level: 1, name: /Mentions légales/ }),
    ).toBeVisible();
    await expect(page.getByText("SIREN", { exact: true })).toBeVisible();
    const contenu = await page.locator("main").innerText();
    expect(contenu).toMatch(/À compléter|\b\d{9}\b/);
    expect(contenu).not.toMatch(/Squelette/i);
    await expect(page.getByRole("link", { name: "Aide" })).toBeVisible();
  });

  test("l'accueil relie l'aide et les mentions légales", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Aide", exact: true }).first(),
    ).toHaveAttribute("href", "/aide");
    await expect(
      page.getByRole("link", { name: "Mentions légales", exact: true }).first(),
    ).toHaveAttribute("href", "/legales");
  });
});
