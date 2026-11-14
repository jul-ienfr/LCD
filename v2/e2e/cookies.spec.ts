import { expect, test } from "@playwright/test";

// Le bandeau n'apparaît que si un suivi est configuré pour le tenant
// (`suivi_configuration.actif`). Le parcours accepter/refuser est couvert par
// `e2e/suivi.spec.ts` sur un tenant dédié ; ici on vérifie le défaut : aucun
// mur de cookies quand rien n'est mesuré, et des préférences lisibles sans JS.
test("bandeau cookies : aucun bandeau sans suivi actif, préférences accessibles", async ({
  page,
  context,
}) => {
  await context.clearCookies();
  await page.goto("/");
  await expect(
    page.getByRole("region", { name: "Choix de suivi" }),
  ).toHaveCount(0);

  await page.goto("/consentement");
  await expect(
    page.getByRole("heading", { name: "Préférences de suivi" }),
  ).toBeVisible();
});
