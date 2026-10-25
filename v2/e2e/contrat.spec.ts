import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("contrat : lien signé, contenu du séjour et signature invalide", async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `ctr-e2e-${suffix}`;
  const nomLogement = `Logement Contrat E2E ${suffix}`;
  const refResa = `ctr-resa-${suffix}`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/logements");
  await page.fill('input[name="code"]', code);
  await page.fill('input[name="nom"]', nomLogement);
  await page.getByRole("button", { name: "Créer le logement" }).click();
  await expect(page.getByText(`Logement « ${code} » créé.`)).toBeVisible();

  await page.goto("/hote/planning?mois=2026-12");
  await page.selectOption('select[name="logement"]', { label: nomLogement });
  await page.getByRole("button", { name: "Afficher" }).click();
  await page.fill('input[name="ref"]', refResa);
  await page.fill('input[name="clientNom"]', "Camille Contrat");
  await page.fill('input[name="debut"]', "2026-12-01");
  await page.fill('input[name="fin"]', "2026-12-05");
  await page.fill('input[name="montantEuros"]', "500");
  await page.getByRole("button", { name: "Créer la réservation" }).click();
  await expect(page.getByText(`Réservation ${refResa} créée`)).toBeVisible();

  const section = page
    .locator("section")
    .filter({ hasText: "Réservations du mois" });
  const ligne = section.locator("li").filter({ hasText: refResa }).first();
  const lienVoyageur = await ligne
    .getByRole("link", { name: "Lien voyageur" })
    .getAttribute("href");
  const token = new URL(lienVoyageur ?? "", "http://localhost:3000")
    .searchParams.get("t");
  expect(token).toBeTruthy();

  const lienContrat = await ligne
    .getByRole("link", { name: "Contrat", exact: true })
    .getAttribute("href");
  expect(lienContrat).toBe(`/contrat/${encodeURIComponent(token ?? "")}`);

  await page.goto(`/contrat/${token}`);
  await expect(
    page.getByRole("heading", { name: "Contrat de séjour" }),
  ).toBeVisible();
  await expect(page.getByText(nomLogement, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(`Référence CT-${refResa}`)).toBeVisible();
  await expect(page.getByText("Camille Contrat")).toBeVisible();
  await expect(page.getByText("01 décembre 2026")).toBeVisible();
  await expect(page.getByText("05 décembre 2026")).toBeVisible();
  await expect(page.getByText("500,00 €")).toBeVisible();
  await expect(page.getByText("Le voyageur — bon pour accord")).toBeVisible();
  await expect(page.getByText("Clauses du séjour")).toBeVisible();

  const falsifie = `${token?.slice(0, -1)}${
    token?.endsWith("A") ? "B" : "A"
  }`;
  await page.goto(`/contrat/${falsifie}`);
  await expect(
    page.getByRole("heading", { name: "Lien indisponible" }),
  ).toBeVisible();
});
