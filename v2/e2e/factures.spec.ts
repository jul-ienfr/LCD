import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("facture : création, totaux, compta et export CSV", async ({ page }) => {
  const numero = `FAC-2026-${Date.now()}`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/factures?mois=2026-11");
  await page.fill('input[name="numero"]', numero);
  await page.fill('input[name="clientNom"]', "Client Facture E2E");
  await page.fill('input[name="dateEmission"]', "2026-11-20");
  await page.fill('input[name="designation"]', "Séjour test");
  await page.fill('input[name="quantite"]', "7");
  await page.fill('input[name="prixUnitaireEuros"]', "120");
  await page.fill('input[name="tvaEuros"]', "87.50");
  await page.fill('input[name="taxeEuros"]', "14");
  await page.getByRole("button", { name: "Créer la facture" }).click();

  await expect(page).toHaveURL(/\/hote\/factures\/[0-9a-f-]+$/);
  await expect(page.getByText(numero).first()).toBeVisible();
  await expect(page.getByText("941,50 €").first()).toBeVisible();

  await page.goto("/hote/compta?mois=2026-11");
  await expect(page.getByText("Comptabilité — novembre 2026")).toBeVisible();
  await expect(page.getByText("TTC facturé").first()).toBeVisible();

  const csvFactures = await page.request.get(
    "/api/exports/factures?mois=2026-11",
  );
  expect(csvFactures.status()).toBe(200);
  expect(csvFactures.headers()["content-type"]).toContain("text/csv");
  expect(await csvFactures.text()).toContain(numero);

  const csvReservations = await page.request.get(
    "/api/exports/reservations?mois=2026-11",
  );
  expect(csvReservations.status()).toBe(200);
  expect(csvReservations.headers()["content-type"]).toContain("text/csv");
});
