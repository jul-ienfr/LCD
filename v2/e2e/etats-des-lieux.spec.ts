import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("états des lieux : constat depuis l’inventaire, manquant et coût", async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `edl-e2e-${suffix}`;
  const nomLogement = `Logement EDL E2E ${suffix}`;
  const qr = `drap-edl-${suffix}`;
  const label = `Drap EDL ${suffix}`;

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

  await page.goto("/hote/inventaire");
  await page.getByRole("link", { name: nomLogement, exact: true }).click();
  await page.waitForURL(/logement=/);
  const logementId = new URL(page.url()).searchParams.get("logement");
  expect(logementId).toBeTruthy();

  await page.fill('input[name="qr"]', qr);
  await page.fill('input[name="categorie"]', "Linge");
  await page.fill('input[name="label"]', label);
  await page.fill('input[name="prixAchat"]', "40");
  await page.getByRole("button", { name: "Enregistrer le bien" }).click();
  await expect(page.getByText("Bien enregistré.")).toBeVisible();

  await page.goto(`/hote/etats-des-lieux?logement=${logementId}`);
  await expect(
    page.getByRole("heading", {
      name: `Nouvel état des lieux — ${nomLogement}`,
    }),
  ).toBeVisible();

  await page.selectOption('select[name="type"]', "sortie");
  await page.check(`input[name="manquant-${qr}"]`);
  await page.fill(`input[name="commentaire-${qr}"]`, "Drap non retrouvé");
  await page.getByRole("button", { name: /Enregistrer l/ }).click();

  await expect(
    page.getByRole("heading", { name: nomLogement }),
  ).toBeVisible();
  await expect(page.getByText("Manquant").first()).toBeVisible();
  await expect(page.getByText("Drap non retrouvé")).toBeVisible();
  await expect(page.getByText(/40,00/).first()).toBeVisible();
  await expect(
    page.getByText("Coût de remplacement", { exact: true }),
  ).toBeVisible();

  await page.goto(`/hote/etats-des-lieux?logement=${logementId}`);
  const historique = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Historique" }) });
  await expect(
    historique.locator("tbody tr").filter({ hasText: nomLogement }).first(),
  ).toBeVisible();
  await expect(historique.getByText(/40,00/).first()).toBeVisible();
});
