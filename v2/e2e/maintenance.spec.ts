/**
 * FR-017 (spec 006) — mode maintenance global, preuve de bout en bout.
 *
 * Le test active la maintenance depuis la supervision, vérifie qu'un visiteur
 * reçoit la page dédiée en 503, que le super-admin reste joignable, que les
 * sondes répondent toujours, puis rouvre le site. La désactivation est dans un
 * `finally` : jamais de site laissé suspendu pour les specs suivantes.
 */
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

test("le site se suspend proprement puis rouvre, sans redéploiement", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await connexion(page);

  await page.goto("/supervision/maintenance");
  await expect(
    page.getByRole("heading", { name: "Mode maintenance" }),
  ).toBeVisible();

  try {
    // Activation en deux étapes : la case de confirmation est obligatoire.
    await page
      .getByPlaceholder(/migration de la base/)
      .fill("Test e2e : suspension contrôlée.");
    await page
      .getByRole("checkbox", { name: /Je confirme suspendre/ })
      .check();
    await page
      .getByRole("button", { name: "Activer la maintenance" })
      .click();
    await expect(page.getByText("Maintenance active")).toBeVisible();
    await expect(page.getByRole("status")).toContainText(
      "le site est suspendu",
    );

    // Visiteur anonyme : page dédiée en 503, message affiché, robots noindex.
    await page.context().clearCookies();
    const suspendu = await page.goto("/");
    expect(suspendu?.status()).toBe(503);
    await expect(
      page.getByRole("heading", { name: /momentanément suspendu/ }),
    ).toBeVisible();
    await expect(
      page.getByText("Test e2e : suspension contrôlée."),
    ).toBeVisible();

    // Une adresse profonde reçoit la même page, sans fuite de contenu.
    const profonde = await page.goto("/hote/factures");
    expect(profonde?.status()).toBe(503);
    await expect(
      page.getByRole("heading", { name: /momentanément suspendu/ }),
    ).toBeVisible();

    // Sondes : le site reste « vivant » pour la supervision externe.
    const health = await page.request.get("/api/health");
    expect(health.status()).toBe(200);
    const ready = await page.request.get("/api/ready");
    expect(ready.status()).toBe(200);

    // API machine : 503 JSON, jamais la page HTML.
    const api = await page.request.get("/api/v1/logements");
    expect(api.status()).toBe(503);
    expect(api.headers()["content-type"]).toContain("application/json");
    expect(await api.json()).toMatchObject({
      error: { code: "MAINTENANCE" },
    });

    // Le super-admin reste joignable et peut rouvrir.
    await connexion(page);
    await page.goto("/supervision/maintenance");
    await expect(page.getByText("Maintenance active")).toBeVisible();
    await page.getByRole("button", { name: "Rouvrir le site" }).click();
    await expect(page.getByRole("status")).toContainText("le site est rouvert");
  } finally {
    // Filet : quoi qu'il arrive, ne jamais laisser le site suspendu.
    try {
      await page.context().clearCookies();
      await connexion(page);
      await page.goto("/supervision/maintenance");
      if (
        await page
          .getByText("Maintenance active")
          .isVisible()
          .catch(() => false)
      ) {
        await page.getByRole("button", { name: "Rouvrir le site" }).click();
        await expect(page.getByRole("status")).toContainText("rouvert");
      }
    } catch {
      // Le test principal remonte déjà l'échec réel ; on ne le masque pas.
    }
  }

  // Visiteur anonyme : le site répond de nouveau.
  await page.context().clearCookies();
  const rouvert = await page.goto("/");
  expect(rouvert?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: /Des maisons/ }),
  ).toBeVisible();
});
