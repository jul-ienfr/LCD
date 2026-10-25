import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("inventaire : création, usage + lavage, état et alertes", async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  const qr = `e2e-bien-${Date.now()}`;
  const label = `E2E drap ${qr}`;

  await page.goto("/hote/inventaire");
  await page.locator('input[name="qr"]:visible').fill(qr);
  await page.locator('input[name="categorie"]:visible').fill("Linge");
  await page.locator('input[name="label"]:visible').fill(label);
  await page.locator('input[name="dateAchat"]:visible').fill("2020-01-01");
  await page.locator('input[name="prixAchat"]:visible').fill("30");
  await page.locator('select[name="etat"]:visible').last().selectOption("2");
  await page.getByRole("button", { name: "Enregistrer le bien" }).click();

  await expect(page.getByText("Bien enregistré.")).toBeVisible();
  const ligne = page.getByRole("row", { name: new RegExp(label) });
  await expect(ligne).toBeVisible();
  await expect(ligne.getByText("2/5 · Usé")).toBeVisible();
  await expect(
    page.getByText(label).first(),
  ).toBeVisible();

  await ligne.getByRole("button", { name: "Utilisé + lavé" }).click();
  await expect(page.getByText("Utilisation enregistrée.")).toBeVisible();
  const ligneUsage = page.getByRole("row", { name: new RegExp(label) });
  await expect(ligneUsage.getByRole("cell", { name: "1", exact: true })).toHaveCount(2);

  await ligneUsage.getByLabel(`Nouvel état de ${label}`).selectOption("4");
  await ligneUsage.getByRole("button", { name: "État" }).click();
  await expect(page.getByText("État du bien mis à jour.")).toBeVisible();
  await expect(
    page.getByRole("row", { name: new RegExp(label) }).getByText("4/5 · Bon"),
  ).toBeVisible();

  await page.goto("/hote/audit?q=inventaire");
  await expect(
    page.getByText("Bien d’inventaire enregistré").first(),
  ).toBeVisible();
});
