/**
 * Test générique de rendu sans JavaScript (T028).
 *
 * Vérifie que les routes publiques et voyageur rendent leur contenu et
 * leurs formulaires sans JavaScript (constitution règle 1, csr = false).
 *
 * Ce test complète site-public.spec.ts (qui teste /site/[slug]) en couvrant
 * les routes générales : /, /login, /aide, /legales, /reserver.
 */

import { expect, test } from "@playwright/test";

test.describe("rendu sans JavaScript — routes publiques", () => {
  test.use({ javaScriptEnabled: false });

  test("la page d'accueil rend son contenu sans JS", async ({ page }) => {
    const reponse = await page.goto("/");
    expect(reponse?.status()).toBe(200);
    // La page doit avoir un h1 visible
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    // Aucun script d'hydratation ne doit être chargé
    const scripts = page.locator('script[src*="_app/immutable/entry"]');
    await expect(scripts).toHaveCount(0);
  });

  test("la page de login rend son formulaire sans JS", async ({ page }) => {
    const reponse = await page.goto("/login");
    expect(reponse?.status()).toBe(200);
    // Le formulaire doit être présent et fonctionnel
    const form = page.locator("form");
    await expect(form).toBeVisible();
    // Un champ email ou identifiant doit exister
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
    // Un champ mot de passe doit exister
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    // Pas d'hydratation JS
    const scripts = page.locator('script[src*="_app/immutable/entry"]');
    await expect(scripts).toHaveCount(0);
  });

  test("la page d'aide rend son contenu sans JS", async ({ page }) => {
    const reponse = await page.goto("/aide");
    expect(reponse?.status()).toBe(200);
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });

  test("la page légale rend son contenu sans JS", async ({ page }) => {
    const reponse = await page.goto("/legales");
    expect(reponse?.status()).toBe(200);
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });

  test("la page de réservation rend son contenu sans JS", async ({ page }) => {
    const reponse = await page.goto("/reserver");
    // /reserver peut retourner 200 (listing) ou 3xx (redirection)
    expect(reponse?.status()).toBeLessThan(400);
  });

  test("les formulaires sont soumis nativement sans JS", async ({ page }) => {
    await page.goto("/login");
    // Remplir le formulaire
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await emailInput.fill("test@lcd.test");
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill("ChangeMe-2026!");
    // Soumettre — même avec des identifiants faux, le POST doit partir
    const [reponse] = await Promise.all([
      page.waitForResponse((r) => r.request().method() === "POST"),
      page.locator('button[type="submit"]').click(),
    ]);
    // On attend une réponse POST (peu importe le statut, le formulaire est natif)
    expect(reponse.request().method()).toBe("POST");
  });
});
