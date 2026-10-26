import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("cycle de vie : publication, archivage doux, restauration et blocage", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const suffix = Date.now();
  const code = `arch-e2e-${suffix}`;
  const nom = `Logement Archive ${suffix}`;
  const refResa = `arch-resa-${suffix}`;

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
  const lien = await page
    .locator("li")
    .filter({ hasText: code })
    .getByRole("link", { name: "Guide" })
    .getAttribute("href");
  const logementId = lien?.split("/").pop() ?? "";

  await page.goto(`/hote/annonce?logement=${logementId}`);
  await page
    .getByRole("checkbox", { name: /Règlement, PV et accord du syndic vérifiés/ })
    .check();
  await page.getByRole("button", { name: "Enregistrer la vérification" }).click();
  await expect(page.getByText("Vérification copropriété enregistrée.")).toBeVisible();
  await page.goto(`/hote/annonce?logement=${logementId}`);
  await page.getByRole("button", { name: "Publier le logement" }).click();
  await expect(page.getByText("Publication : publiée")).toBeVisible();

  await page.goto(`/hote/annonce?logement=${logementId}`);
  await page.getByRole("button", { name: "Archiver le logement" }).click();
  await expect(page.getByText("Confirmer l’archivage de")).toBeVisible();
  await page.getByRole("button", { name: "Confirmer l’archivage" }).click();
  await expect(
    page.getByText("Logement archivé : il reste dans l’historique"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Publier le logement" }),
  ).toHaveCount(0);
  await expect(page.getByText("Statut actuel : archive")).toBeVisible();

  await page.getByRole("button", { name: "Restaurer le logement" }).click();
  await expect(page.getByText("Logement restauré en brouillon.")).toBeVisible();
  await expect(page.getByText("Statut actuel : actif")).toBeVisible();
  await expect(page.getByText("Publication : brouillon")).toBeVisible();

  await page.goto("/hote/planning?mois=2027-06");
  await page.selectOption('select[name="logement"]', { label: nom });
  await page.getByRole("button", { name: "Afficher" }).click();
  await page.fill('input[name="ref"]', refResa);
  await page.fill('input[name="clientNom"]', "Client Archivage");
  await page.fill('input[name="debut"]', "2027-06-10");
  await page.fill('input[name="fin"]', "2027-06-12");
  await page.fill('input[name="montantEuros"]', "300");
  await page.getByRole("button", { name: "Créer la réservation" }).click();
  await expect(page.getByText(`Réservation ${refResa} créée`)).toBeVisible();

  await page.goto(`/hote/annonce?logement=${logementId}`);
  await page.getByRole("button", { name: "Archiver le logement" }).click();
  await page.getByRole("button", { name: "Confirmer l’archivage" }).click();
  await expect(page.getByText(/bloquent l’archivage/)).toBeVisible();
  await expect(page.getByText(refResa)).toBeVisible();
  await expect(page.getByText("Statut actuel : actif")).toBeVisible();
});
