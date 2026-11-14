import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

/** Navigation robuste : rejoue en cas d'`ERR_ABORTED` du routeur client. */
async function aller(page: import("@playwright/test").Page, url: string) {
  await expect(async () => {
    await page.goto(url, { waitUntil: "domcontentloaded" });
  }).toPass({ timeout: 20_000 });
}

test("import CSV puis réservation test guidée", async ({ page }) => {
  test.setTimeout(90_000);
  const suffix = Date.now();
  const code = `e2e-csv-${suffix}`;
  const nom = `Import ${suffix}`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await aller(page, "/hote/import");
  const fichiers = page.locator('input[name="fichier"]');
  await fichiers
    .first()
    .setInputFiles({
      name: "logements.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(`code,nom,adresse\n${code},${nom},1 rue du Test`),
    });
  await page.getByRole("button", { name: "Importer les logements" }).click();
  await expect(page.locator("[data-rapport-import]")).toContainText(
    "1 ligne(s) importée(s)",
  );

  await fichiers
    .nth(1)
    .setInputFiles({
      name: "reservations.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        `ref,logement,debut,fin,client_nom,voyageurs,montant_centimes\n` +
          `CSV-${suffix},${code},2031-02-01,2031-02-04,Ada,2,30000`,
      ),
    });
  await page.getByRole("button", { name: "Importer les réservations" }).click();
  await expect(page.locator("[data-rapport-import]")).toContainText(
    "1 ligne(s) importée(s)",
  );

  await aller(page, "/hote/onboarding/reservation-test");
  await page.waitForLoadState("networkidle");
  const select = page.locator('select[name="logementId"]');
  const valeur = await select.locator("option", { hasText: nom }).getAttribute("value");
  expect(valeur).toBeTruthy();
  await expect(async () => {
    await select.selectOption(valeur!);
    await expect(select).toHaveValue(valeur!);
  }).toPass({ timeout: 20_000 });
  await page.fill('input[name="debut"]', "2031-03-01");
  await page.fill('input[name="fin"]', "2031-03-03");
  await page.getByRole("button", { name: "Créer la réservation test" }).click();
  await expect(page.getByText(/Réservation test TEST-/)).toBeVisible();

  const ligneTest = page.locator("li").filter({ hasText: "TEST-" }).first();
  await expect(ligneTest).toContainText(nom);
  await page.waitForLoadState("networkidle");
  await ligneTest.getByRole("link", { name: "Ouvrir le guide" }).click();
  await expect(page).toHaveURL(/\/guide\//);
  await expect(page.getByText(nom).first()).toBeVisible();

  // Nettoyage : annulation du séjour test.
  await aller(page, "/hote/onboarding/reservation-test");
  await page.waitForLoadState("networkidle");
  const ligneASupprimer = page.locator("li").filter({ hasText: "TEST-" }).first();
  await ligneASupprimer.getByRole("button", { name: "Annuler" }).click();
  await expect(page.getByText("Réservation test annulée.")).toBeVisible();
});
