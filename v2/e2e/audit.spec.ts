import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("audit : période, famille et export CSV filtré", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/audit");
  await expect(page.getByText(/sur les 90 derniers jours/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Rétention" }),
  ).toBeVisible();
  await expect(page.getByText(/Conservation 1825 jours/)).toBeVisible();

  await page.selectOption('select[name="jours"]', "7");
  await page.selectOption('select[name="famille"]', "utilisateur");
  await page.getByRole("button", { name: "Filtrer" }).click();

  await expect(page).toHaveURL(/jours=7/);
  await expect(page).toHaveURL(/famille=utilisateur/);
  await expect(page.getByText(/sur les 7 derniers jours/)).toBeVisible();
  await expect(page.getByText(/· Utilisateurs/)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Exporter le journal CSV" }),
  ).toHaveAttribute("href", /jours=7/);
  await expect(
    page.getByRole("link", { name: "Exporter le journal CSV" }),
  ).toHaveAttribute("href", /famille=utilisateur/);

  const reponse = await page.request.get(
    "/api/exports/audit?jours=7&famille=utilisateur",
  );
  expect(reponse.status()).toBe(200);
  expect(reponse.headers()["content-type"]).toContain("text/csv");
  expect(reponse.headers()["content-disposition"]).toContain("audit-7j.csv");
  const contenu = await reponse.text();
  expect(contenu).toContain("date_iso");
  expect(contenu).toContain("utilisateur.creer");
  expect(contenu).not.toContain("menage.evaluer");
});
