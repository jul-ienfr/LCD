import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("rapprochement bancaire : import CSV, appariement et alertes", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const suffix = Date.now();
  const numero = `RAP-${suffix}`;
  const reference = `VIR-RAPP-${suffix}`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/factures?mois=2026-11");
  await page.fill('input[name="numero"]', numero);
  await page.fill('input[name="clientNom"]', "Client Rapprochement");
  await page.fill('input[name="dateEmission"]', "2026-11-20");
  await page.fill('input[name="designation"]', "Séjour rapprochement");
  await page.fill('input[name="quantite"]', "1");
  await page.fill('input[name="prixUnitaireEuros"]', "777.77");
  await page.fill('input[name="tvaEuros"]', "0");
  await page.fill('input[name="taxeEuros"]', "0");
  await page.getByRole("button", { name: "Créer la facture" }).click();
  await expect(page.getByText(numero).first()).toBeVisible();
  await page.getByRole("button", { name: "Marquer émise" }).click();
  await expect(page.getByText("emise").first()).toBeVisible();

  await page.fill('input[name="montantEuros"]', "777.77");
  await page.fill('input[name="datePaiement"]', "2026-11-22");
  await page.fill('input[name="reference"]', reference);
  await page.selectOption('select[name="mode"]', "virement");
  await page.getByRole("button", { name: "Enregistrer le paiement" }).click();
  await expect(page.getByText("Facture soldée.")).toBeVisible();

  const csv = [
    "date;libelle;montant;reference",
    `22/11/2026;VIR ${reference};777,77;${reference}`,
    "01/01/2026;VIREMENT INCONNU ANCIEN;123,45;",
  ].join("\n");

  await page.goto("/hote/compta/rapprochement");
  await page.setInputFiles('input[name="fichier"]', {
    name: "releve.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv, "utf8"),
  });
  await page.getByRole("button", { name: "Importer et rapprocher" }).click();
  await expect(page).toHaveURL(/\/hote\/compta\/rapprochement\?import=/);

  const tableau = page.locator("table");
  await expect(tableau).toContainText(`VIR ${reference}`);
  await expect(tableau).toContainText("Rapproché");
  await expect(tableau).toContainText("VIREMENT INCONNU ANCIEN");
  await expect(tableau).toContainText("Orpheline");
  await expect(page.getByText(/Écart supérieur à 2 %/)).toBeVisible();
  await expect(page.getByText(/orpheline\(s\) de plus de 7 jours/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Paiements enregistrés non retrouvés/ }),
  ).toBeVisible();

  const modele = await page.request.get("/api/exports/modele-rapprochement");
  expect(modele.status()).toBe(200);
  expect(modele.headers()["content-type"]).toContain("text/csv");
  expect(await modele.text()).toContain("date;libelle;montant");
});
