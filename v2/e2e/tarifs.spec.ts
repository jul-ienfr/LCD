import { expect, test } from "@playwright/test";

test("tarifs : trois offres et calculateur sans JavaScript", async ({ page }) => {
  await page.goto("/tarifs?logements=3&ca=3000");

  await expect(page.getByRole("heading", { name: /Confiez, pilotez/ })).toBeVisible();
  for (const nom of ["FULL", "PILOTAGE", "KIT"]) {
    await expect(page.getByRole("heading", { name: nom, exact: true })).toBeVisible();
  }

  // 3 × 149 €/mois pour PILOTAGE.
  await expect(page.getByRole("cell", { name: "447 €" })).toBeVisible();
  await expect(page.getByText("3 logement(s) × 149 €/mois.").first()).toBeVisible();

  // Le calculateur reste un formulaire GET natif.
  const formulaire = page.locator('form[method="GET"]');
  await expect(formulaire).toBeVisible();
  await formulaire.locator('input[name="logements"]').fill("2");
  await formulaire.getByRole("button", { name: "Calculer" }).click();
  await expect(page).toHaveURL(/logements=2/);
  await expect(page.getByRole("cell", { name: "298 €" })).toBeVisible();
});
