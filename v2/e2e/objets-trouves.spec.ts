import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("objets trouvés : déclaration, réclamation, envoi et don", async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `obj-e2e-${suffix}`;
  const nomLogement = `Logement Objets E2E ${suffix}`;
  const description = `Chargeur USB ${suffix}`;
  const descriptionAncienne = `Parapluie ${suffix}`;
  const aujourdHui = new Date().toISOString().slice(0, 10);
  const ilYa40Jours = new Date(Date.now() - 40 * 86_400_000)
    .toISOString()
    .slice(0, 10);

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

  await page.goto("/hote/objets-trouves");
  await page.getByRole("link", { name: nomLogement, exact: true }).click();
  await page.waitForURL(/logement=/);

  await page.fill('input[name="description"]', description);
  await page.fill('input[name="lieu"]', "Salon");
  await page.fill('input[name="voyageurNom"]', "Camille Test");
  await page.fill('input[name="contact"]', "camille@example.com");
  await page.getByRole("button", { name: "Enregistrer l’objet" }).click();

  await expect(page.getByText("Objet enregistré.")).toBeVisible();
  const carte = page.locator("li").filter({ hasText: description }).first();
  await expect(carte.getByText("Trouvé", { exact: true })).toBeVisible();
  await expect(carte.getByText("Don possible dans 30 jours.")).toBeVisible();

  await carte.getByText("Réclamer cet objet").click();
  await carte
    .getByRole("button", { name: /Marquer réclamé/ })
    .click();

  await expect(
    page.getByText("Objet réclamé : 15,00 € de frais."),
  ).toBeVisible();
  const carteReclamee = page
    .locator("li")
    .filter({ hasText: description })
    .first();
  await expect(carteReclamee.getByText("Réclamé", { exact: true })).toBeVisible();
  await expect(carteReclamee.getByText("15,00 €", { exact: true })).toBeVisible();
  await expect(carteReclamee.getByText("Camille Test")).toBeVisible();

  await carteReclamee.getByRole("button", { name: "Marquer envoyé" }).click();
  await expect(page.getByText("Objet marqué envoyé.")).toBeVisible();
  const carteEnvoyee = page
    .locator("li")
    .filter({ hasText: description })
    .first();
  await expect(carteEnvoyee.getByText("Envoyé", { exact: true })).toBeVisible();
  await expect(
    carteEnvoyee.getByText(`Envoyé le ${aujourdHui}`),
  ).toBeVisible();

  await page.fill('input[name="description"]', descriptionAncienne);
  await page.fill('input[name="lieu"]', "Chambre");
  await page.fill('input[name="trouveLe"]', ilYa40Jours);
  await page.getByRole("button", { name: "Enregistrer l’objet" }).click();

  await expect(page.getByText("Objet enregistré.")).toBeVisible();
  const carteAncienne = page
    .locator("li")
    .filter({ hasText: descriptionAncienne })
    .first();
  await carteAncienne
    .getByRole("button", { name: "Donner / remettre au stock" })
    .click();

  await expect(page.getByText("Objet donné ou remis au stock.")).toBeVisible();
  await expect(
    page
      .locator("li")
      .filter({ hasText: descriptionAncienne })
      .first()
      .getByText("Donné / stock"),
  ).toBeVisible();
});
