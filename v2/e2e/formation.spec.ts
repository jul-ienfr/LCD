import { expect, test, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

const MODULES = [
  "Accueil voyageur",
  "Ménage et inventaire",
  "Urgences et sécurité",
  "Facturation et paiements",
];

function carteModule(page: Page, titre: string) {
  return page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: titre, exact: true }) });
}

test("formation : progression par module, reprise et isolation", async ({
  page,
  browser,
}) => {
  const suffix = Date.now();
  const email = `formation-${suffix}@lcd.test`;
  const motDePasse = `Formation-${suffix}!`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/utilisateurs");
  await page.fill('input[name="name"]', `Formation E2E ${suffix}`);
  await page.fill('input[name="email"]', email);
  await page.selectOption('select[name="role"]', "hote");
  await page.fill('input[name="password"]', motDePasse);
  await page.getByRole("button", { name: "Créer le compte" }).click();
  await expect(page.getByText(`Compte créé pour ${email}.`)).toBeVisible();

  const contexte = await browser.newContext();
  const apprenant = await contexte.newPage();
  await apprenant.goto("/login");
  await apprenant.fill('input[type="email"]', email);
  await apprenant.fill('input[type="password"]', motDePasse);
  await apprenant.getByRole("button", { name: "Se connecter" }).click();
  await expect(apprenant).toHaveURL(/\/hote$/);

  await apprenant.goto("/hote/formation");
  await expect(
    apprenant.getByRole("heading", { name: "Formation de l’équipe" }),
  ).toBeVisible();
  for (const titre of MODULES) {
    await expect(
      carteModule(apprenant, titre).getByRole("heading", { name: titre }),
    ).toBeVisible();
  }
  await expect(apprenant.getByText("0 / 16 étapes · 0 %")).toBeVisible();

  const accueil = carteModule(apprenant, "Accueil voyageur");
  const cases = accueil.locator('input[type="checkbox"]');
  const total = await cases.count();
  for (let i = 0; i < total; i += 1) {
    await cases.nth(i).check();
  }
  await accueil
    .getByRole("button", { name: "Enregistrer ma progression" })
    .click();

  await expect(
    apprenant.getByText("Progression enregistrée (accueil) · 100 %."),
  ).toBeVisible();
  await expect(accueil.getByText("Terminé")).toBeVisible();
  await expect(apprenant.getByText("4 / 16 étapes · 25 %")).toBeVisible();

  await apprenant.reload();
  const accueilRelu = carteModule(apprenant, "Accueil voyageur");
  await expect(accueilRelu.getByText("Terminé")).toBeVisible();
  await expect(
    accueilRelu.locator('input[type="checkbox"]').first(),
  ).toBeChecked();

  await accueilRelu.locator('input[type="checkbox"]').first().uncheck();
  await accueilRelu
    .getByRole("button", { name: "Enregistrer ma progression" })
    .click();

  await expect(
    apprenant.getByText("Progression enregistrée (accueil) · 75 %."),
  ).toBeVisible();
  await expect(apprenant.getByText("3 / 16 étapes · 19 %")).toBeVisible();
  await expect(
    carteModule(apprenant, "Accueil voyageur").getByText("Terminé"),
  ).toHaveCount(0);

  await contexte.close();
});
