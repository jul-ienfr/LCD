import { expect, test } from "@playwright/test";
import { codeTotp, secretDepuisUri } from "./totp";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("2FA : activation TOTP, connexion en deux étapes et désactivation", async ({
  page,
  browser,
}) => {
  const suffix = Date.now();
  const nom = `2FA E2E ${suffix}`;
  const email = `deux-facteurs-${suffix}@lcd.test`;
  const motDePasse = `DeuxFacteurs-${suffix}!`;

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

  const contexte = await browser.newContext();
  const page2 = await contexte.newPage();
  await page2.goto("/login");
  await page2.fill('input[type="email"]', email);
  await page2.fill('input[type="password"]', motDePasse);
  await page2.getByRole("button", { name: "Se connecter" }).click();
  await expect(page2).toHaveURL(/\/hote$/);

  // Activation : le QR code contient l'URI otpauth avec le secret.
  await page2.goto("/hote/securite");
  const section2fa = page2
    .locator("section")
    .filter({ hasText: "Authentification à deux facteurs" });
  await section2fa.locator('input[type="password"]').fill(motDePasse);
  await section2fa.getByRole("button", { name: "Activer la 2FA" }).click();
  await expect(section2fa.locator("code")).toContainText("otpauth://");

  const uri = (await section2fa.locator("code").textContent()) ?? "";
  const secret = secretDepuisUri(uri);
  const codeActivation = codeTotp(secret);
  await section2fa
    .locator('input[autocomplete="one-time-code"]')
    .fill(codeActivation);
  await section2fa
    .getByRole("button", { name: "Vérifier et activer" })
    .click();
  await expect(
    section2fa.getByText("2FA activée. Conservez vos codes de secours."),
  ).toBeVisible();

  // Déconnexion puis reconnexion : le code TOTP est exigé.
  await page2.goto("/hote");
  await page2.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page2).toHaveURL(/\/login$/);

  await page2.fill('input[type="email"]', email);
  await page2.fill('input[type="password"]', motDePasse);
  await page2.getByRole("button", { name: "Se connecter" }).click();
  await expect(page2).toHaveURL(/\/two-factor$/);

  // Fenêtre suivante : le code d'activation ne peut pas être rejoué.
  const codeConnexion = codeTotp(secret, Date.now() + 30_000);
  await page2
    .locator('input[autocomplete="one-time-code"]')
    .fill(codeConnexion);
  await page2.getByRole("button", { name: "Vérifier" }).click();
  await expect(page2).toHaveURL(/\/hote$/);
  await expect(
    page2.getByRole("heading", { name: `Bonjour ${nom}` }),
  ).toBeVisible();

  // Désactivation avec le mot de passe.
  await page2.goto("/hote/securite");
  const sectionActive = page2
    .locator("section")
    .filter({ hasText: "Authentification à deux facteurs" });
  await sectionActive.locator('input[type="password"]').fill(motDePasse);
  await sectionActive.getByRole("button", { name: "Désactiver la 2FA" }).click();
  await expect(sectionActive.getByText("2FA désactivée.")).toBeVisible();

  await contexte.close();

  // Nettoyage : le compte de test est désactivé.
  await page.goto("/hote/utilisateurs");
  const ligne = page.locator("li").filter({ hasText: email });
  await ligne.getByRole("button", { name: "Désactiver le compte" }).click();
  await expect(
    ligne.getByText(`Compte de ${email} désactivé. Ses sessions sont fermées.`),
  ).toBeVisible();
});
