import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

async function connexion(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);
}

test("facture : fiscalité auto, Factur-X, compta et export CSV", async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `fac-e2e-${suffix}`;
  const nom = `Facturation E2E ${suffix}`;
  const refResa = `resa-fac-${suffix}`;
  const numeroAuto = `FAC-2026-${suffix}`;
  const numeroManuel = `FAC-2026-M-${suffix}`;

  await connexion(page);

  // 1. Logement de test.
  await page.goto("/hote/logements");
  await page.fill('input[name="code"]', code);
  await page.fill('input[name="nom"]', nom);
  await page.getByRole("button", { name: "Créer le logement" }).click();
  await expect(page.getByText(`Logement « ${code} » créé.`)).toBeVisible();

  // 2. Paramètres fiscaux du tenant.
  await page.goto("/hote/compta/parametres");
  await page.fill('input[name="tauxTva"]', "10");
  await page.fill('input[name="taxeNuitEuros"]', "1.50");
  await page.fill('input[name="plafondEuros"]', "4.20");
  await page.fill('input[name="prefixeFacture"]', "FAC");
  await page.fill(
    'textarea[name="mentionsLegales"]',
    "TVA acquittée sur les encaissements.",
  );
  await page.getByRole("button", { name: "Enregistrer les paramètres" }).click();
  await expect(
    page.getByText("Paramètres fiscaux enregistrés."),
  ).toBeVisible();

  // 3. Réservation de 3 nuits pour 2 voyageurs.
  await page.goto("/hote/planning?mois=2026-11");
  await page.selectOption('select[name="logement"]', { label: nom });
  await page.getByRole("button", { name: "Afficher" }).click();
  await page.fill('input[name="ref"]', refResa);
  await page.fill('input[name="clientNom"]', "Client Facture E2E");
  await page.fill('input[name="voyageurs"]', "2");
  await page.fill('input[name="debut"]', "2026-11-10");
  await page.fill('input[name="fin"]', "2026-11-13");
  await page.fill('input[name="montantEuros"]', "360");
  await page.getByRole("button", { name: "Créer la réservation" }).click();
  await expect(page.getByText(`Réservation ${refResa} créée`)).toBeVisible();

  // 4. Facture liée, TVA et taxe laissées vides : calcul automatique.
  await page.goto("/hote/factures?mois=2026-11");
  await page.fill('input[name="numero"]', numeroAuto);
  const valeurResa = await page
    .locator('select[name="reservationId"] option')
    .filter({ hasText: refResa })
    .getAttribute("value");
  await page.selectOption('select[name="reservationId"]', valeurResa ?? "");
  await page.fill('input[name="dateEmission"]', "2026-11-20");
  await page.getByRole("button", { name: "Créer la facture" }).click();

  await expect(page).toHaveURL(/\/hote\/factures\/[0-9a-f-]+$/);
  await expect(page.getByText(numeroAuto).first()).toBeVisible();
  await expect(page.getByText("405,00 €").first()).toBeVisible();

  const factureId = page.url().split("/").pop() ?? "";
  const xml = await page.request.get(`/api/factures/${factureId}/factur-x`);
  expect(xml.status()).toBe(200);
  expect(xml.headers()["content-type"]).toContain("application/xml");
  const contenuXml = await xml.text();
  expect(contenuXml).toContain(`<ram:ID>${numeroAuto}</ram:ID>`);
  expect(contenuXml).toContain(
    "<ram:GrandTotalAmount>405.00</ram:GrandTotalAmount>",
  );
  expect(contenuXml).toContain("<ram:Reason>Taxe de séjour</ram:Reason>");
  expect(contenuXml).toContain(
    "<ram:RateApplicablePercent>10.00</ram:RateApplicablePercent>",
  );
  expect(contenuXml).toContain("TVA acquittée sur les encaissements.");

  // 5. Statuts puis compta.
  await page.getByRole("button", { name: "Marquer émise" }).click();
  await expect(page.getByText("emise").first()).toBeVisible();
  await page.getByRole("button", { name: "Marquer payée" }).click();
  await expect(page.getByText("payee").first()).toBeVisible();

  // 6. Surcharge manuelle de la TVA et de la taxe.
  await page.goto("/hote/factures?mois=2026-11");
  await page.fill('input[name="numero"]', numeroManuel);
  await page.fill('input[name="clientNom"]', "Client Manuel E2E");
  await page.fill('input[name="dateEmission"]', "2026-11-21");
  await page.fill('input[name="designation"]', "Séjour manuel");
  await page.fill('input[name="quantite"]', "1");
  await page.fill('input[name="prixUnitaireEuros"]', "100");
  await page.fill('input[name="tvaEuros"]', "0");
  await page.fill('input[name="taxeEuros"]', "5");
  await page.getByRole("button", { name: "Créer la facture" }).click();
  await expect(page.getByText(numeroManuel).first()).toBeVisible();
  await expect(page.getByText("105,00 €").first()).toBeVisible();

  // 7. Compta et exports.
  await page.goto("/hote/compta?mois=2026-11");
  await expect(page.getByText("TTC facturé").first()).toBeVisible();

  const csvFactures = await page.request.get(
    "/api/exports/factures?mois=2026-11",
  );
  expect(csvFactures.status()).toBe(200);
  expect(csvFactures.headers()["content-type"]).toContain("text/csv");
  const csv = await csvFactures.text();
  expect(csv).toContain(numeroAuto);
  expect(csv).toContain(numeroManuel);

  const csvReservations = await page.request.get(
    "/api/exports/reservations?mois=2026-11",
  );
  expect(csvReservations.status()).toBe(200);
  expect(csvReservations.headers()["content-type"]).toContain("text/csv");
});
