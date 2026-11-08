import { expect, test } from "@playwright/test";

test.describe("dégradé sans JavaScript", () => {
  test("la vitrine rend son contenu", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Des maisons",
    );
    await expect(page.getByRole("button", { name: "Rechercher" })).toBeVisible();
  });

  test("le formulaire de connexion fonctionne en POST natif", async ({ page }) => {
    const email = process.env.SEED_ADMIN_EMAIL ?? "";
    const motDePasse = process.env.SEED_ADMIN_PASSWORD ?? "";
    test.skip(!email || !motDePasse, "Identifiants de seed absents.");

    await page.goto("/login");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', motDePasse);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/hote/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Bonjour",
    );
  });

  test("l’espace voyageur s’explique en POST natif", async ({ page }) => {
    await page.goto("/voyageur");
    await expect(
      page.getByRole("heading", { name: "Votre séjour" }),
    ).toBeVisible();
    await expect(page.getByText("Ouvrez le lien personnel")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Retour à l’accueil", exact: true }),
    ).toBeVisible();
  });

  test("la galerie design reste lisible", async ({ page }) => {
    await page.goto("/design");
    await expect(
      page.getByRole("heading", { name: "Design system" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Primaire" })).toBeVisible();
  });
});

test("santé applicative", async ({ request }) => {
  const reponse = await request.get("/api/health");
  expect(reponse.ok()).toBeTruthy();
  expect(await reponse.json()).toMatchObject({ ok: true, stack: "sveltekit-3" });
});
