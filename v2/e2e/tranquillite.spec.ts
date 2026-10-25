import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("tranquillité : mesure, dépassement, attestation et lettre", async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `trq-e2e-${suffix}`;
  const nomLogement = `Logement Tranquillité E2E ${suffix}`;

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

  await page.goto("/hote/tranquillite");
  await page.getByRole("link", { name: nomLogement, exact: true }).click();
  await page.waitForURL(/logement=/);

  await page.selectOption('select[name="type"]', "db");
  await page.selectOption('select[name="moment"]', "nuit");
  await page.fill('input[name="valeurDb"]', "62");
  await page.fill('textarea[name="note"]', "Fête voisine jusqu’à 2 h.");
  await page.getByRole("button", { name: "Enregistrer la preuve" }).click();

  await expect(page.getByText("Preuve enregistrée.")).toBeVisible();
  const ligneBruit = page
    .locator("tbody tr")
    .filter({ hasText: "62 dB" })
    .first();
  await expect(ligneBruit).toContainText("dépassement");
  await expect(ligneBruit).toContainText("Fête voisine");

  const carteMax = page
    .getByText("Maximum relevé", { exact: true })
    .locator("..");
  await expect(carteMax).toContainText("62 dB");
  const carteDepassements = page
    .getByText("Dépassements", { exact: true })
    .locator("..");
  await expect(carteDepassements).toContainText("1");

  await page.selectOption('select[name="type"]', "attestation");
  await page.fill(
    'textarea[name="note"]',
    "Attestation du gardien de l’immeuble.",
  );
  await page.getByRole("button", { name: "Enregistrer la preuve" }).click();

  await expect(page.getByText("Preuve enregistrée.")).toBeVisible();
  const ligneAttestation = page
    .locator("tbody tr")
    .filter({ hasText: "Attestation du gardien" })
    .first();
  await expect(
    ligneAttestation.getByText("Attestation", { exact: true }),
  ).toBeVisible();

  await page.getByText("Lettre au syndic (brouillon)").click();
  const brouillon = page.locator("textarea[readonly]");
  await expect(brouillon).toHaveValue(new RegExp(nomLogement));
  await expect(brouillon).toHaveValue(/62 dB/);
  await expect(brouillon).toHaveValue(/Fête voisine/);

  await ligneBruit.getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByText("Preuve supprimée.")).toBeVisible();
  await expect(
    page.locator("tbody tr").filter({ hasText: "62 dB" }),
  ).toHaveCount(0);
  const carteMaxApres = page
    .getByText("Maximum relevé", { exact: true })
    .locator("..");
  await expect(carteMaxApres).toContainText("—");
});
