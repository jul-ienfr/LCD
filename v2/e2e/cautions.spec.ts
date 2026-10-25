import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("cautions : création, réception et retenue", async ({ page }) => {
  const suffix = Date.now();
  const code = `cau-e2e-${suffix}`;
  const nom = `Caution E2E ${suffix}`;
  const ref = `resa-cau-${suffix}`;

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

  await page.goto("/hote/planning?mois=2027-03");
  await page.selectOption('select[name="logement"]', { label: nom });
  await page.getByRole("button", { name: "Afficher" }).click();
  await page.fill('input[name="ref"]', ref);
  await page.fill('input[name="clientNom"]', "Client Caution");
  await page.fill('input[name="debut"]', "2027-03-10");
  await page.fill('input[name="fin"]', "2027-03-14");
  await page.fill('input[name="montantEuros"]', "800");
  await page.getByRole("button", { name: "Créer la réservation" }).click();
  await expect(page.getByText(`Réservation ${ref} créée`)).toBeVisible();

  await page.goto("/hote/cautions?mois=2027-03");
  const valeurReservation = await page
    .locator('select[name="reservationId"] option')
    .filter({ hasText: ref })
    .getAttribute("value");
  await page.selectOption('select[name="reservationId"]', valeurReservation ?? "");
  await page.fill('input[name="montantEuros"]', "500");
  await page.getByRole("button", { name: "Créer la caution" }).click();
  await expect(page.getByText("Caution créée.")).toBeVisible();

  const ligne = page.locator("li").filter({ hasText: ref }).first();
  await expect(ligne).toContainText("Attendue");
  await expect(ligne).toContainText("caution 500,00 €");

  await ligne.getByRole("button", { name: "Marquer reçue" }).click();
  await expect(page.getByText("Caution mise à jour.")).toBeVisible();
  await expect(ligne).toContainText("Reçue");

  await ligne.locator('input[name="montantRetenuEuros"]').fill("120");
  await ligne.locator('input[name="motifRetenue"]').fill("Dégât mobilier");
  await ligne.getByRole("button", { name: "Retenir" }).click();
  await expect(page.getByText("Caution mise à jour.")).toBeVisible();
  await expect(ligne).toContainText("Retenue partielle");
  await expect(ligne).toContainText("Retenu : 120,00 €");
  await expect(ligne).toContainText("Motif : Dégât mobilier");
});
