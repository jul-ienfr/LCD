import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

async function connexion(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);
}

test("super-admin : accès refusé aux admins puis pages plateforme", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const suffix = Date.now();
  const email = `super-e2e-${suffix}@lcd.test`;
  const motDePasse = `Super-E2E-${suffix}!`;

  await connexion(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await expect(page.getByRole("link", { name: "Supervision plateforme" })).toHaveCount(0);

  await page.goto("/supervision");
  await expect(page).toHaveURL(/\/login\?erreur=acces/);

  await page.goto("/hote/utilisateurs");
  await page.fill('input[name="name"]', "Super E2E");
  await page.fill('input[name="email"]', email);
  await page.selectOption('select[name="role"]', "super_admin");
  await page.fill('input[name="password"]', motDePasse);
  await page.getByRole("button", { name: "Créer le compte" }).click();
  await expect(page.getByText(`Compte créé pour ${email}.`)).toBeVisible();
  await page.context().clearCookies();

  await connexion(page, email, motDePasse);
  await expect(
    page.getByRole("link", { name: "Supervision plateforme" }),
  ).toBeVisible();

  await page.goto("/supervision");
  await expect(
    page.getByRole("heading", { name: "Supervision" }),
  ).toBeVisible();
  await expect(page.getByText("Vue agrégée, lecture seule")).toBeVisible();
  await expect(page.getByRole("link", { name: "Consulter" }).first()).toBeVisible();

  await page.goto("/supervision/fournisseurs");
  await expect(
    page.getByRole("heading", { name: "Fournisseurs channel manager" }),
  ).toBeVisible();
  await expect(page.getByText("Beds24").first()).toBeVisible();
  await expect(page.getByText("Channex").first()).toBeVisible();

  await page.goto("/systeme");
  await expect(page.getByRole("heading", { name: "Système" })).toBeVisible();
  await expect(page.getByText("Schéma à jour.")).toBeVisible();
  await expect(page.getByText("Version PostgreSQL")).toBeVisible();

  await page.goto("/secrets");
  await expect(
    page.getByRole("heading", { name: "Secrets et connecteurs" }),
  ).toBeVisible();
  await expect(page.getByText("BETTER_AUTH_SECRET")).toBeVisible();
  await expect(page.getByText("local-dev-only-change-me")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Rotation" })).toBeVisible();

  await page.goto("/journal?action=utilisateur");
  await expect(
    page.getByRole("heading", { name: "Journal global" }),
  ).toBeVisible();
  await expect(page.getByText(/entrée\(s\) affichée\(s\)/)).toBeVisible();
  await expect(page.getByText("utilisateur.creer").first()).toBeVisible();

  await page.goto("/supervision/voir-comme");
  await page.selectOption('select[name="role"]', "comptable");
  await page.getByRole("button", { name: "Démarrer l’aperçu lecture seule" }).click();
  await expect(page).toHaveURL(/\/hote$/);
  await expect(
    page.getByText("Aperçu lecture seule", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Supervision plateforme" }),
  ).toHaveCount(0);

  const ecriture = await page.request.post("/hote/logements", {
    form: { code: `apercu-interdit-${suffix}`, nom: "Aperçu interdit" },
  });
  expect(ecriture.url()).toContain("/preview/lecture-seule");
  expect(await ecriture.text()).toContain("Écriture bloquée");

  await page.goto("/supervision/voir-comme");
  await expect(page.getByText("Aperçu en cours")).toBeVisible();
  await page.getByRole("button", { name: "Quitter l’aperçu" }).first().click();
  await expect(page).toHaveURL(/\/supervision$/);
  await expect(
    page.getByText("Aperçu lecture seule", { exact: true }),
  ).toHaveCount(0);

  await page.goto("/journal?action=apercu");
  await expect(page.getByText("apercu.demarrer").first()).toBeVisible();
  await expect(page.getByText("apercu.arreter").first()).toBeVisible();
});
