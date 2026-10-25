import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("phrases types : modèles, variables, édition et suppression", async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `phr-e2e-${suffix}`;
  const nomLogement = `Logement Phrases E2E ${suffix}`;
  const titreEdite = `Arrivée ${suffix}`;

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

  await page.goto("/hote/phrases");
  await page.getByRole("link", { name: nomLogement, exact: true }).click();
  await page.waitForURL(/logement=/);

  await page.getByRole("button", { name: "Installer les modèles" }).click();
  await expect(page.getByText("Modèles installés.")).toBeVisible();
  await expect(page.getByText("Message d’arrivée")).toBeVisible();
  await expect(page.getByText("Remerciement")).toBeVisible();
  await expect(page.getByText(/Bonjour Camille/).first()).toBeVisible();

  const carte = page
    .locator("li")
    .filter({ hasText: "Message d’arrivée" })
    .first();
  await carte.getByRole("link", { name: "Modifier" }).click();

  const titre = page.locator('input[name="titre"]');
  await expect(titre).toHaveValue("Message d’arrivée");
  await titre.fill(titreEdite);
  await page.fill(
    'textarea[name="contenu"]',
    "Bienvenue {voyageur} au {logement} !",
  );
  await page.getByRole("button", { name: "Enregistrer la phrase" }).click();

  await expect(page.getByText("Phrase enregistrée.")).toBeVisible();
  const carteEditee = page.locator("li").filter({ hasText: titreEdite }).first();
  await expect(carteEditee).toBeVisible();
  await expect(
    carteEditee.getByText(`Bienvenue Camille au ${nomLogement} !`),
  ).toBeVisible();

  const carteRemerciement = page
    .locator("li")
    .filter({ hasText: "Remerciement" })
    .first();
  await carteRemerciement
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page.getByText("Phrase supprimée.")).toBeVisible();
  await expect(
    page.getByText("Remerciement", { exact: true }),
  ).toHaveCount(0);
});
