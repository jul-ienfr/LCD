import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("utilisateurs : création, connexion, réinitialisation et désactivation", async ({
  page,
  browser,
}) => {
  const suffix = Date.now();
  const nom = `Équipe E2E ${suffix}`;
  const email = `equipe-${suffix}@lcd.test`;
  const motDePasse = `Provisoire-${suffix}!`;
  const nouveauMotDePasse = `Nouveau-${suffix}!`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/utilisateurs");
  await page.fill('input[name="name"]', nom);
  await page.fill('input[name="email"]', email);
  await page.selectOption('select[name="role"]', "hote");
  await page.fill('input[name="password"]', motDePasse);
  await page.getByRole("button", { name: "Créer le compte" }).click();

  await expect(page.getByText(`Compte créé pour ${email}.`)).toBeVisible();
  await expect(page.getByText(email, { exact: true })).toBeVisible();

  const ligne = page.locator("li").filter({ hasText: email });

  // Connexion du nouveau compte.
  const contexte1 = await browser.newContext();
  const page1 = await contexte1.newPage();
  await page1.goto("/login");
  await page1.fill('input[type="email"]', email);
  await page1.fill('input[type="password"]', motDePasse);
  await page1.getByRole("button", { name: "Se connecter" }).click();
  await expect(page1).toHaveURL(/\/hote$/);
  await expect(
    page1.getByRole("heading", { name: `Bonjour ${nom}` }),
  ).toBeVisible();

  // Un rôle non-admin ne peut pas ouvrir la gestion des comptes.
  await page1.goto("/hote/utilisateurs");
  await expect(page1).toHaveURL(/\/login\?erreur=acces$/);

  // Réinitialisation par l'admin.
  await ligne.locator("summary").click();
  await ligne.locator('input[name="password"]').fill(nouveauMotDePasse);
  await ligne
    .locator('input[name="confirmation"]')
    .fill(nouveauMotDePasse);
  await ligne
    .getByRole("button", { name: "Réinitialiser le mot de passe" })
    .click();
  await expect(
    ligne.getByText(
      `Mot de passe réinitialisé pour ${email}. Ses sessions ont été fermées.`,
    ),
  ).toBeVisible();

  // La session ouverte avant la réinitialisation est bien révoquée.
  await page1.goto("/hote");
  await expect(page1).toHaveURL(/\/login$/);
  await contexte1.close();

  const contexte2 = await browser.newContext();
  const page2 = await contexte2.newPage();
  await page2.goto("/login");
  await page2.fill('input[type="email"]', email);
  await page2.fill('input[type="password"]', nouveauMotDePasse);
  await page2.getByRole("button", { name: "Se connecter" }).click();
  await expect(page2).toHaveURL(/\/hote$/);

  // Désactivation : sessions fermées et connexion refusée.
  await ligne.getByRole("button", { name: "Désactiver le compte" }).click();
  await expect(
    ligne.getByText(
      `Compte de ${email} désactivé. Ses sessions sont fermées.`,
    ),
  ).toBeVisible();
  await expect(ligne.getByText("Désactivé", { exact: true })).toBeVisible();

  // La session ouverte avant la désactivation est bien révoquée.
  await page2.goto("/hote");
  await expect(page2).toHaveURL(/\/login$/);
  await contexte2.close();

  const contexte3 = await browser.newContext();
  const page3 = await contexte3.newPage();
  await page3.goto("/login");
  await page3.fill('input[type="email"]', email);
  await page3.fill('input[type="password"]', nouveauMotDePasse);
  await page3.getByRole("button", { name: "Se connecter" }).click();
  await expect(
    page3.getByText("Compte désactivé. Contactez un administrateur."),
  ).toBeVisible();
  await expect(page3).toHaveURL(/\/login$/);
  await contexte3.close();

  // Réactivation.
  await ligne.getByRole("button", { name: "Réactiver le compte" }).click();
  await expect(
    ligne.getByText(`Compte de ${email} réactivé.`),
  ).toBeVisible();
  await expect(ligne.getByText("Actif", { exact: true })).toBeVisible();
});
