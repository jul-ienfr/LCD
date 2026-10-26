import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("fiche de police : dépôt voyageur, lecture hôte, purge planifiée", async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `pol-e2e-${suffix}`;
  const nomLogement = `Logement Police E2E ${suffix}`;
  const refResa = `pol-resa-${suffix}`;

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
  await page.fill('input[name="clientNom"]', "Voyageur Police");
  await page.fill('input[name="voyageurs"]', "2");
  await page.fill('input[name="debut"]', "2026-12-10");
  await page.fill('input[name="fin"]', "2026-12-14");
  await page.fill('input[name="montantEuros"]', "420");
  await page.getByRole("button", { name: "Créer la réservation" }).click();
  await expect(page.getByText(`Réservation ${refResa} créée`)).toBeVisible();

  const ligne = page
    .locator("section")
    .filter({ hasText: "Réservations du mois" })
    .locator("li")
    .filter({ hasText: refResa })
    .first();
  const href = await ligne
    .getByRole("link", { name: "Lien voyageur" })
    .getAttribute("href");
  const token = new URL(href ?? "", "http://localhost:3000").searchParams.get(
    "t",
  );
  expect(token).toBeTruthy();

  await page.goto(`/voyageur?t=${token}`);
  await page.getByRole("link", { name: "Remplir une fiche" }).click();
  await page.waitForURL(/\/voyageur\/police\?t=/);
  await expect(page.getByText("0/2 fiche(s) reçue(s)")).toBeVisible();

  await page.fill('input[name="nom"]', "Dupont");
  await page.fill('input[name="prenoms"]', "Marie");
  await page.fill('input[name="dateNaissance"]', "1990-04-12");
  await page.fill('input[name="lieuNaissance"]', "Lyon");
  await page.fill('input[name="nationalite"]', "Française");
  await page.fill('input[name="telephone"]', "+33 6 12 34 56 78");
  await page.fill(
    'input[name="domicile"]',
    "12 rue des Fleurs, 69003 Lyon",
  );
  await page.getByRole("button", { name: "Enregistrer la fiche" }).click();

  await expect(page.getByText("Fiche enregistrée. Merci.")).toBeVisible();
  await expect(page.getByText("1/2 fiche(s) reçue(s)")).toBeVisible();

  await page.goto("/hote/police");
  await expect(
    page.getByRole("heading", { name: "Fiches de police" }),
  ).toBeVisible();
  const tableau = page.locator("table");
  await expect(tableau).toContainText(refResa);
  await expect(tableau).toContainText(nomLogement);
  await expect(tableau).toContainText("Marie Dupont");
  await expect(tableau).toContainText("+33 6 12 34 56 78");
  await expect(tableau).toContainText("1990-04-12");

  const purge = await page.request.post("/api/cron/purge-police", {
    headers: {
      authorization: `Bearer ${process.env.CRON_SECRET ?? "local-test-cron-secret-2026"}`,
    },
  });
  expect(purge.status()).toBe(200);
  expect(await purge.json()).toMatchObject({ ok: true });
});
