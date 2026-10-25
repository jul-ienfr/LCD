import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("sinistres : déclaration, expertise, indemnisation et clôture", async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `sin-e2e-${suffix}`;
  const nomLogement = `Logement Sinistre E2E ${suffix}`;
  const numero = `SIN-${suffix}`;

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

  await page.goto("/hote/sinistres");
  await page.getByRole("link", { name: nomLogement, exact: true }).click();
  await page.waitForURL(/logement=/);

  await page.fill('input[name="montantEstime"]', "1200");
  await page.fill('input[name="franchise"]', "150");
  await page.fill(
    'textarea[name="description"]',
    "Fuite sous l’évier constatée au départ du voyageur.",
  );
  await page.fill('input[name="numeroDeclaration"]', numero);
  await page.getByRole("button", { name: "Déclarer le sinistre" }).click();

  await expect(page.getByText("Sinistre déclaré.")).toBeVisible();
  const ligne = page
    .locator("tbody tr")
    .filter({ hasText: `SIN-${suffix}` })
    .first();
  await expect(ligne.getByText("Déclaré", { exact: true })).toBeVisible();
  await expect(ligne).toContainText("1 200,00 €");
  await expect(ligne).toContainText("150,00 €");
  await expect(ligne).toContainText("1 050,00 €");

  await ligne.getByRole("button", { name: "Passer en expertise" }).click();
  await expect(page.getByText("Statut mis à jour.")).toBeVisible();
  await expect(
    ligne.getByText("En expertise", { exact: true }),
  ).toBeVisible();

  await ligne.locator('input[name="montantIndemnise"]').fill("900");
  await ligne.getByRole("button", { name: "Indemniser" }).click();
  await expect(page.getByText("Statut mis à jour.")).toBeVisible();
  await expect(ligne.getByText("Indemnisé", { exact: true })).toBeVisible();
  await expect(ligne).toContainText("900,00 €");

  await ligne.getByRole("button", { name: "Clôturer" }).click();
  await expect(page.getByText("Statut mis à jour.")).toBeVisible();
  await expect(ligne.getByText("Clos", { exact: true })).toBeVisible();
  await expect(ligne.getByText("Dossier clos")).toBeVisible();

  const carteOuverts = page
    .getByText("Dossiers ouverts", { exact: true })
    .locator("..");
  await expect(carteOuverts).toContainText("0");
});
