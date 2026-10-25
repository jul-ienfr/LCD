import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("tourisme : lieu global, filtre catégorie et affichage voyageur", async ({
  page,
}) => {
  const suffix = Date.now();
  const slug = `e2e-lieu-${suffix}`;
  const nom = `E2E plage ${suffix}`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/tourisme");
  await page.locator('input[name="slug"]:visible').fill(slug);
  await page.fill('input[name="nom"]', nom);
  await page.selectOption('select[name="categorie"]', "plage");
  await page.fill('input[name="commune"]', "Nice");
  await page.fill('input[name="acces"]', "5 min à pied");
  await page.fill('input[name="prixIndicatif"]', "gratuit");
  await page.getByRole("button", { name: "Enregistrer le lieu" }).click();
  await expect(page.getByText("Lieu enregistré.")).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(nom) })).toBeVisible();

  // Un voyageur voit le lieu global et peut filtrer par catégorie.
  const code = `tour-e2e-${suffix}`;
  const logementNom = `Tourisme E2E ${suffix}`;
  const ref = `resa-tour-${suffix}`;
  await page.goto("/hote/logements");
  await page.fill('input[name="code"]', code);
  await page.fill('input[name="nom"]', logementNom);
  await page.getByRole("button", { name: "Créer le logement" }).click();
  await expect(page.getByText(`Logement « ${code} » créé.`)).toBeVisible();

  await page.goto("/hote/planning?mois=2026-12");
  await page.selectOption('select[name="logement"]', { label: logementNom });
  await page.getByRole("button", { name: "Afficher" }).click();
  await page.fill('input[name="ref"]', ref);
  await page.fill('input[name="debut"]', "2026-12-01");
  await page.fill('input[name="fin"]', "2026-12-04");
  await page.fill('input[name="montantEuros"]', "300");
  await page.getByRole("button", { name: "Créer la réservation" }).click();
  await expect(page.getByText(`Réservation ${ref} créée`)).toBeVisible();

  const href = await page
    .locator("section")
    .filter({ hasText: "Réservations du mois" })
    .locator("li")
    .filter({ hasText: ref })
    .first()
    .getByRole("link", { name: "Lien voyageur" })
    .getAttribute("href");
  expect(href).toContain("/voyageur?t=");

  await page.goto(`${href}&cat=plage`);
  await expect(page.getByRole("heading", { name: "Bonnes adresses" })).toBeVisible();
  await expect(page.getByText(nom)).toBeVisible();
  await expect(page.getByRole("link", { name: "Plage" })).toBeVisible();
});
