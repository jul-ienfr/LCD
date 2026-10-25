import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("stocks : seuil, liste de courses, réassort et consommation", async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  const code = `e2e-stock-${Date.now()}`;
  const label = `E2E consommable ${code}`;

  await page.goto("/hote/stocks");

  if (await page.getByText("Créez d’abord un logement").isVisible()) {
    await page.goto("/hote/logements");
    await page.fill('input[name="code"]', `log-${Date.now()}`);
    await page.fill('input[name="nom"]', "Logement stocks E2E");
    await page.getByRole("button", { name: "Créer le logement" }).click();
    await expect(page.getByText(/Logement « .* » créé/)).toBeVisible();
    await page.goto("/hote/stocks");
  }

  await page.locator('input[name="code"]:visible').fill(code);
  await page.locator('input[name="label"]:visible').fill(label);
  await page.locator('input[name="stock"]:visible').fill("0");
  await page.locator('input[name="seuil"]:visible').fill("2");
  await page.locator('input[name="cible"]:visible').fill("6");
  await page.locator('input[name="consoRotation"]:visible').fill("1");
  await page.getByRole("button", { name: "Enregistrer" }).click();

  await expect(page.getByText("Consommable enregistré.")).toBeVisible();
  const ligne = page.getByRole("row", { name: new RegExp(label) });
  await expect(ligne).toBeVisible();
  await expect(ligne.getByText("Rupture")).toBeVisible();
  await expect(page.getByText(`6 × ${label}`)).toBeVisible();

  await ligne.getByRole("button", { name: "Réassort" }).click();
  await expect(
    page.getByText("Réassort enregistré : stocks remis à la cible."),
  ).toBeVisible();
  const ligneApres = page.getByRole("row", { name: new RegExp(label) });
  await expect(ligneApres.getByText("6 unité")).toBeVisible();
  await expect(ligneApres.getByText("OK")).toBeVisible();

  await ligneApres.getByRole("button", { name: "Consommer" }).click();
  await expect(
    page.getByText("Rotation consommée : stocks décrémentés."),
  ).toBeVisible();
  await expect(
    page.getByRole("row", { name: new RegExp(label) }).getByText("5 unité"),
  ).toBeVisible();

  // Le journal d'audit retrouve l'action par sa référence.
  await page.goto("/hote/audit?q=stock");
  await expect(
    page.getByText("Consommable enregistré").first(),
  ).toBeVisible();
});
