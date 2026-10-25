import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("réservation directe : tarifs, devis, demande et espace séjour", async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `direct-e2e-${suffix}`;
  const nom = `Direct E2E ${suffix}`;
  const email = `direct-${suffix}@example.test`;

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

  await page.goto("/hote/prix?mois=2027-02");
  await page.selectOption('select[name="logement"]', { label: nom });
  await page.getByRole("button", { name: "Afficher" }).click();
  await expect(page.getByText(nom, { exact: false }).first()).toBeVisible();

  for (const [date, prix] of [
    ["2027-02-01", "100"],
    ["2027-02-02", "120"],
    ["2027-02-03", "120"],
  ] as const) {
    await page.fill('input[name="date"]', date);
    await page.fill('input[name="prixEuros"]', prix);
    await page.getByRole("button", { name: "Enregistrer le prix" }).click();
    await expect(
      page.getByText(`Prix du ${date} enregistré`),
    ).toBeVisible();
  }

  await page.goto("/reserver?tenant=lcd");
  const carte = page.locator("li").filter({ hasText: nom });
  await carte.getByRole("link", { name: "Voir les disponibilités" }).click();
  await expect(page.getByRole("heading", { name: nom })).toBeVisible();

  await page.fill('input[name="debut"]', "2027-02-01");
  await page.fill('input[name="fin"]', "2027-02-04");
  await page.fill('input[name="voyageurs"]', "2");
  await page.getByRole("button", { name: "Calculer le prix" }).click();

  await expect(page.getByText("3 nuits · 340,00 € estimés")).toBeVisible();
  await expect(page.getByText("2027-02-01")).toBeVisible();

  await page.fill('input[name="nom"]', "Camille Direct");
  await page.fill('input[name="email"]', email);
  await page.getByRole("button", { name: "Envoyer la demande" }).click();

  await expect(
    page.getByRole("heading", { name: "Demande enregistrée" }),
  ).toBeVisible();
  const reference = await page
    .locator("section")
    .filter({ hasText: "Demande enregistrée" })
    .locator("strong")
    .innerText();
  expect(reference).toMatch(/^DIR-[A-Z0-9]{12}$/);
  await expect(page.getByText("340,00 €")).toBeVisible();

  await page
    .getByRole("link", { name: "Ouvrir mon espace séjour" })
    .click();
  await expect(page).toHaveURL(/\/voyageur\?t=/);
  await expect(page.getByText(nom).first()).toBeVisible();

  const memoire = page.locator("section#memoire");
  await memoire.getByLabel("Nom").fill("Camille Direct");
  await memoire
    .getByLabel("Préférences (lit bébé, allergie, étage…)")
    .fill("Lit bébé\nÉtage calme");
  await memoire
    .getByLabel("J’accepte que mes préférences soient conservées pendant 24 mois.")
    .check();
  await memoire
    .getByRole("button", { name: "Enregistrer mes préférences" })
    .click();
  await expect(page.getByText("Préférences enregistrées pour 24 mois.").first())
    .toBeVisible();

  await page.getByRole("button", { name: "Oublier mes préférences" }).click();
  await expect(page.getByText("Préférences effacées.")).toBeVisible();
});
