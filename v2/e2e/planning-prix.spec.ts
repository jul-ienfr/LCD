import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("prix + planning : création, anti-chevauchement", async ({ page }) => {
  const suffix = Date.now();
  const code = `plan-e2e-${suffix}`;
  const nom = `Planning E2E ${suffix}`;
  const ref = `resa-e2e-${suffix}`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  // 1. Un logement dédié au test.
  await page.goto("/hote/logements");
  await page.fill('input[name="code"]', code);
  await page.fill('input[name="nom"]', nom);
  await page.getByRole("button", { name: "Créer le logement" }).click();
  await expect(page.getByText(`Logement « ${code} » créé.`)).toBeVisible();

  // 2. Prix du 2026-11-15.
  await page.goto("/hote/prix?mois=2026-11");
  await page.selectOption('select[name="logement"]', { label: nom });
  await page.getByRole("button", { name: "Afficher" }).click();
  await expect(page.getByText(nom, { exact: false }).first()).toBeVisible();

  await page.fill('input[name="date"]', "2026-11-15");
  await page.fill('input[name="prixEuros"]', "150");
  await page.getByRole("button", { name: "Enregistrer le prix" }).click();
  await expect(
    page.getByText("Prix du 2026-11-15 enregistré"),
  ).toBeVisible();
  await expect(page.getByText("150,00 €").first()).toBeVisible();

  // 3. Réservation du 15 au 18 novembre.
  await page.goto("/hote/planning?mois=2026-11");
  await page.selectOption('select[name="logement"]', { label: nom });
  await page.getByRole("button", { name: "Afficher" }).click();

  await page.fill('input[name="ref"]', ref);
  await page.fill('input[name="clientNom"]', "Client E2E");
  await page.fill('input[name="debut"]', "2026-11-15");
  await page.fill('input[name="fin"]', "2026-11-18");
  await page.fill('input[name="montantEuros"]', "450");
  await page.getByRole("button", { name: "Créer la réservation" }).click();
  await expect(
    page.getByText(`Réservation ${ref} créée`),
  ).toBeVisible();
  await expect(page.getByText(ref).first()).toBeVisible();

  // 4. Chevauchement refusé.
  await page.fill('input[name="ref"]', `${ref}-bis`);
  await page.fill('input[name="debut"]', "2026-11-16");
  await page.fill('input[name="fin"]', "2026-11-19");
  await page.getByRole("button", { name: "Créer la réservation" }).click();
  await expect(
    page.getByText("Ce logement est déjà occupé sur cette période."),
  ).toBeVisible();
});
