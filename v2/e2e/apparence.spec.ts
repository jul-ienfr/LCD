import { expect, test } from "@playwright/test";

const email = process.env.SEED_SUPER_ADMIN_EMAIL ?? "super@lcd.test";
const motDePasse =
  process.env.SEED_SUPER_ADMIN_PASSWORD ??
  process.env.SEED_ADMIN_PASSWORD ??
  "";

test.skip(
  !email || !motDePasse,
  "SEED_SUPER_ADMIN_EMAIL / SEED_SUPER_ADMIN_PASSWORD absents de .env.local",
);

async function connexion(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', motDePasse);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote/);
}

async function choisirEtEnregistrer(
  page: import("@playwright/test").Page,
  theme: string,
) {
  await page.goto("/supervision/apparence");
  await page.getByRole("radio", { name: new RegExp(theme) }).check();
  await page
    .getByRole("button", { name: "Enregistrer le brouillon" })
    .click();
  await expect(page.getByRole("status")).toContainText("Brouillon enregistré");
  await page.waitForLoadState("networkidle");
}

test("le super-admin enregistre un brouillon d’apparence", async ({ page }) => {
  await connexion(page);
  await choisirEtEnregistrer(page, "Sable");
});

test("aperçu signé, publication et retour arrière", async ({ page }) => {
  await connexion(page);
  await choisirEtEnregistrer(page, "Sable");

  await page.getByRole("button", { name: "Prévisualiser" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("status")).toContainText("Aperçu du brouillon");

  const accentApercu = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim(),
  );
  expect(accentApercu.toLowerCase()).toBe("#a34707");

  await page.goto("/supervision/apparence");
  await page
    .getByPlaceholder("Ex. passage au thème Sable pour l’été")
    .fill("Test publication Sable");
  await page.getByRole("button", { name: "Publier pour tout le site" }).click();
  await expect(page.getByRole("status")).toContainText("publiée pour tout le site");
  await page.waitForLoadState("networkidle");

  await page.goto("/");
  const accentPublic = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim(),
  );
  expect(accentPublic.toLowerCase()).toBe("#a34707");

  await choisirEtEnregistrer(page, "Séjour");
  await page.goto("/supervision/apparence");
  await page.getByRole("button", { name: "Publier pour tout le site" }).click();
  await expect(page.getByRole("status")).toContainText("publiée pour tout le site");

  await page.goto("/");
  const accentRestaure = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim(),
  );
  expect(accentRestaure.toLowerCase()).toBe("#0e7c6b");
});

test("le thème publié s’applique au public, au voyageur et au staff", async ({ page }) => {
  await connexion(page);
  await choisirEtEnregistrer(page, "Sable");
  await page.getByRole("button", { name: "Prévisualiser" }).click();
  await expect(page).toHaveURL("/");

  for (const route of ["/aide", "/reserver", "/design", "/hote", "/hote/compta"]) {
    await page.goto(route);
    const accent = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim(),
    );
    expect(accent.toLowerCase(), route).toBe("#a34707");
  }
});
