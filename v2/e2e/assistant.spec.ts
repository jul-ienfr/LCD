import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("assistant : routage, brouillon et refus d’un code d’accès", async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `asst-e2e-${suffix}`;
  const nomLogement = `Loft Assistant E2E ${suffix}`;

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

  await page.goto("/hote/assistant");
  await page.getByRole("link", { name: nomLogement, exact: true }).click();
  await page.selectOption('select[name="intention"]', "arrivee");
  await page.selectOption('select[name="ton"]', "chaleureux");
  await page.fill('input[name="voyageur"]', "Camille");
  await page.fill(
    'textarea[name="details"]',
    "Arrivée possible dès 14 h, lit bébé installé.",
  );
  await page.getByRole("button", { name: "Rédiger le brouillon" }).click();

  await expect(
    page.getByRole("heading", { name: "Brouillon", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("standard", { exact: true }).first()).toBeVisible();
  const carteBrouillon = page
    .locator("div.bg-accent-douce")
    .filter({ hasText: "Bonjour Camille," });
  await expect(carteBrouillon).toBeVisible();
  await expect(carteBrouillon).toContainText(
    "14 h, lit bébé installé.",
  );
  await page.getByText("Prompt envoyé au modèle").click();
  await expect(page.getByText(/80 mots maximum/)).toBeVisible();

  await page.fill(
    'textarea[name="details"]',
    "Le code d’accès est 4821, merci.",
  );
  await page.getByRole("button", { name: "Rédiger le brouillon" }).click();
  await expect(
    page.getByText(
      "Ne jamais inclure de code d’accès (PIN) dans un brouillon.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Brouillon", exact: true }),
  ).toHaveCount(0);
});
