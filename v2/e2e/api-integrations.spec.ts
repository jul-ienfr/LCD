import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

/** Navigation robuste : rejoue en cas d'`ERR_ABORTED` du routeur client. */
async function aller(page: import("@playwright/test").Page, url: string) {
  await expect(async () => {
    await page.goto(url, { waitUntil: "domcontentloaded" });
  }).toPass({ timeout: 20_000 });
}

/**
 * T717 — Parcours complet : création d'une clé API depuis l'UI, appel réel de
 * `/api/v1/logements`, refus sans clé, révocation puis refus de la clé révoquée.
 * La page Nuki est vérifiée dans le même parcours (T711).
 */
test("API v1 : clé, appel authentifié, révocation et page Nuki", async ({
  page,
  request,
}) => {
  test.setTimeout(90_000);
  const nom = `E2E API ${Date.now()}`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await aller(page, "/hote/integrations/api");
  await expect(
    page.getByRole("heading", { name: "Clés API" }),
  ).toBeVisible();

  // Sans clé : 401.
  const sansCle = await request.get("/api/v1/logements");
  expect(sansCle.status()).toBe(401);

  await page.fill('input[name="nom"]', nom);
  await page.check('input[name="scopes"][value="logements:lire"]');
  await page.getByRole("button", { name: "Générer la clé" }).click();

  const cle = (await page.locator("[data-cle-clair]").textContent())?.trim();
  expect(cle).toMatch(/^lcd_[A-Za-z0-9_-]+$/);

  const avecCle = await request.get("/api/v1/logements", {
    headers: { Authorization: `Bearer ${cle}` },
  });
  expect(avecCle.status()).toBe(200);
  const corps = await avecCle.json();
  expect(Array.isArray(corps.data)).toBe(true);
  expect(corps.pagination).toMatchObject({ page: 1, limite: 50 });
  expect(avecCle.headers()["x-request-id"]).toBeTruthy();

  // Un autre scope reste refusé.
  const mauvaisScope = await request.get("/api/v1/releves", {
    headers: { Authorization: `Bearer ${cle}` },
  });
  expect(mauvaisScope.status()).toBe(403);

  // Révocation depuis l'UI.
  const ligne = page.locator("li[data-cle]").filter({ hasText: nom }).first();
  await expect(ligne).toBeVisible();
  await ligne.getByRole("button", { name: "Révoquer" }).click();
  await expect(page.getByText("La clé a été révoquée.")).toBeVisible();

  const apresRevocation = await request.get("/api/v1/logements", {
    headers: { Authorization: `Bearer ${cle}` },
  });
  expect(apresRevocation.status()).toBe(401);

  // Page d'intégration Nuki accessible et cohérente.
  await aller(page, "/hote/integrations/nuki");
  await expect(
    page.getByRole("heading", { name: "Serrures Nuki" }),
  ).toBeVisible();
  await expect(page.getByText("État de la connexion")).toBeVisible();
});
