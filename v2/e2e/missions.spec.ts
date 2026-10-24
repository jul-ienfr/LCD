import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";
const PRESTA_EMAIL = process.env.SEED_PRESTA_EMAIL ?? "presta@lcd.test";
const PRESTA_PASSWORD =
  process.env.SEED_PRESTA_PASSWORD ?? "ChangeMe-2026!";

test("missions : création staff, exécution prestataire", async ({
  page,
  browser,
}) => {
  const suffix = Date.now();
  const code = `mis-e2e-${suffix}`;
  const nom = `Mission E2E ${suffix}`;
  const ref = `MIS-2026-${suffix}`;

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

  await page.goto("/hote/missions?mois=2026-12");
  await page.selectOption('select[name="logementId"]', { label: `${nom} (${code})` });
  await page.selectOption('select[name="assignedUserId"]', {
    label: `Prestataire LCD (${PRESTA_EMAIL})`,
  });
  await page.fill('input[name="ref"]', ref);
  await page.fill('input[name="date"]', "2026-12-06");
  await page.fill('input[name="heure"]', "10:00");
  await page.fill('textarea[name="notes"]', "Ménage de départ E2E");
  await page.getByRole("button", { name: "Créer la mission" }).click();
  await expect(page.getByText(`Mission ${ref} créée`)).toBeVisible();

  const contextePresta = await browser.newContext();
  const pagePresta = await contextePresta.newPage();
  await pagePresta.goto("/login");
  await pagePresta.fill('input[type="email"]', PRESTA_EMAIL);
  await pagePresta.fill('input[type="password"]', PRESTA_PASSWORD);
  await pagePresta.getByRole("button", { name: "Se connecter" }).click();
  await expect(pagePresta).toHaveURL(/\/presta$/);
  await expect(pagePresta.getByText(ref).first()).toBeVisible();

  await pagePresta.getByRole("button", { name: "Commencer" }).first().click();
  await expect(pagePresta.getByText("en_cours").first()).toBeVisible();
  await pagePresta.getByRole("button", { name: "Terminer" }).first().click();
  await expect(pagePresta.getByText("terminee").first()).toBeVisible();

  await contextePresta.close();
});
