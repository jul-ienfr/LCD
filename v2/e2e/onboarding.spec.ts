import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("onboarding : la copropriété non vérifiée bloque la mise en ligne", async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `e2e-onb-${suffix}`;
  const nom = `Onboarding ${suffix}`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/logements");
  await page.fill('input[name="code"]', code);
  await page.fill('input[name="nom"]', nom);
  await page.getByRole("button", { name: "Créer le logement" }).click();
  await expect(page.getByText(`Logement « ${code} » créé.`)).toBeVisible();

  await page.goto("/hote/onboarding");
  await page.getByRole("link", { name: nom, exact: true }).click();
  await expect(page).toHaveURL(/\/hote\/onboarding\?logement=/);
  await expect(page.getByText("Non publiable")).toBeVisible();

  const avant = await page.request.get("/reserver?tenant=lcd");
  expect(await avant.text()).not.toContain(nom);

  await page
    .getByRole("checkbox", { name: /Règlement, PV et accord du syndic/ })
    .check();
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(
    page.getByText("Vérification copropriété enregistrée."),
  ).toBeVisible();

  const apres = await page.request.get("/reserver?tenant=lcd");
  expect(await apres.text()).toContain(nom);
});
