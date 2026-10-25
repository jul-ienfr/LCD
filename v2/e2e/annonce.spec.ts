import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("annonce : neuf mentions, étiquettes DPE/GES et persistance", async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `ann-e2e-${suffix}`;
  const nomLogement = `Logement Annonce E2E ${suffix}`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/logements");
  await page.fill('input[name="code"]', code);
  await page.fill('input[name="nom"]', nomLogement);
  await page.getByRole("button", { name: "Créer le logement" }).click();
  await expect(page.getByText(`Logement « ${code} » créé.`)).toBeVisible();

  await page.goto("/hote/annonce");
  await page.getByRole("link", { name: nomLogement, exact: true }).click();
  await page.waitForURL(/logement=/);

  await expect(page.getByText("0 / 9 mentions · 0 %")).toBeVisible();
  await expect(page.getByText("À compléter")).toBeVisible();

  const mentions = page.locator('input[name^="mention-"]');
  await expect(mentions).toHaveCount(9);
  for (let i = 0; i < 9; i += 1) {
    await mentions.nth(i).check();
  }
  await page.selectOption('select[name="dpeClasse"]', "D");
  await page.selectOption('select[name="gesClasse"]', "B");
  await page.selectOption('select[name="classement"]', "3_etoiles");
  await page.fill('input[name="numeroEnregistrement"]', "06088202600012");
  await page.fill('input[name="numeroCerfa"]', "14004*05");
  await page.getByRole("button", { name: "Enregistrer la conformité" }).click();

  await expect(page.getByText("Conformité enregistrée.")).toBeVisible();
  await expect(page.getByText("9 / 9 mentions · 100 %")).toBeVisible();
  await expect(page.getByText("Conforme", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Toutes les mentions sont cochées."),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByText("Conforme", { exact: true })).toBeVisible();
  await expect(page.locator('select[name="dpeClasse"]')).toHaveValue("D");
  await expect(
    page.locator('input[name="numeroEnregistrement"]'),
  ).toHaveValue("06088202600012");

  await page.locator('input[name="mention-surface"]').uncheck();
  await page.getByRole("button", { name: "Enregistrer la conformité" }).click();

  await expect(page.getByText("Conformité enregistrée.")).toBeVisible();
  await expect(page.getByText("8 / 9 mentions · 89 %")).toBeVisible();
  await expect(page.getByText("À compléter")).toBeVisible();
  await expect(
    page.getByText("Surface habitable", { exact: true }).last(),
  ).toBeVisible();
});
