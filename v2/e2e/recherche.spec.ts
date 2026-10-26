import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("recherche globale : logement, séjour et facture par référence", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const suffix = Date.now();
  const code = `search-e2e-${suffix}`;
  const refResa = `search-resa-${suffix}`;
  const numero = `search-fac-${suffix}`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/logements");
  await page.fill('input[name="code"]', code);
  await page.fill('input[name="nom"]', `Logement Recherche ${suffix}`);
  await page.getByRole("button", { name: "Créer le logement" }).click();
  await expect(page.getByText(`Logement « ${code} » créé.`)).toBeVisible();

  await page.goto("/hote/planning?mois=2027-02");
  await page.selectOption('select[name="logement"]', {
    label: `Logement Recherche ${suffix}`,
  });
  await page.getByRole("button", { name: "Afficher" }).click();
  await page.fill('input[name="ref"]', refResa);
  await page.fill('input[name="clientNom"]', "Client Recherche");
  await page.fill('input[name="debut"]', "2027-02-10");
  await page.fill('input[name="fin"]', "2027-02-12");
  await page.fill('input[name="montantEuros"]', "240");
  await page.getByRole("button", { name: "Créer la réservation" }).click();
  await expect(page.getByText(`Réservation ${refResa} créée`)).toBeVisible();

  await page.goto("/hote/factures?mois=2027-02");
  await page.fill('input[name="numero"]', numero);
  await page.fill('input[name="clientNom"]', "Client Recherche");
  await page.fill('input[name="dateEmission"]', "2027-02-11");
  await page.fill('input[name="designation"]', "Séjour recherche");
  await page.fill('input[name="quantite"]', "1");
  await page.fill('input[name="prixUnitaireEuros"]', "240");
  await page.fill('input[name="tvaEuros"]', "0");
  await page.fill('input[name="taxeEuros"]', "0");
  await page.getByRole("button", { name: "Créer la facture" }).click();
  await expect(page.getByText(numero).first()).toBeVisible();

  await page.goto(`/hote/recherche?q=${encodeURIComponent(code)}`);
  await expect(
    page.getByRole("heading", { name: "Logements" }),
  ).toBeVisible();
  const lienLogement = page.getByRole("link", { name: code });
  await expect(lienLogement).toBeVisible();
  await expect(lienLogement).toHaveAttribute("href", /\/hote\/logements\//);

  await page.goto(`/hote/recherche?q=${encodeURIComponent(refResa)}`);
  await expect(
    page.getByRole("heading", { name: "Réservations" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: refResa })).toHaveAttribute(
    "href",
    "/hote/planning?mois=2027-02",
  );

  await page.goto(`/hote/recherche?q=${encodeURIComponent(numero)}`);
  await expect(page.getByRole("heading", { name: "Factures" })).toBeVisible();
  await expect(page.getByRole("link", { name: numero })).toHaveAttribute(
    "href",
    /\/hote\/factures\/[0-9a-f-]+$/,
  );

  await page.goto("/hote/recherche?q=a");
  await expect(page.getByText("Saisissez au moins 2 caractères.")).toBeVisible();
});
