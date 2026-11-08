import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("prix par plan tarifaire : création, isolation, désactivation", async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `plan-tarif-e2e-${suffix}`;
  const nom = `Logement plan ${suffix}`;
  const codePlan = `non-remboursable-${suffix}`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/logements");
  await page.fill('input[name="code"]', code);
  await page.fill('input[name="nom"]', nom);
  await page.getByRole("button", { name: "Créer le logement" }).click();
  await expect(page.getByText(`Logement « ${code} » créé.`)).toBeVisible();

  await page.goto("/hote/prix?mois=2026-12");
  await page.selectOption('select[name="logement"]', { label: nom });
  await page.getByRole("button", { name: "Afficher" }).click();

  await page.fill('input[name="nom"]', "Non remboursable");
  await page.fill('input[name="code"]', codePlan);
  await page.fill('input[name="externalRatePlanId"]', `rp-${suffix}`);
  await page.fill('input[name="priorite"]', "1");
  await page.getByRole("button", { name: "Créer le plan" }).click();
  await expect(page.getByText("Plan tarifaire créé.")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Définir un prix — Non remboursable/ }),
  ).toBeVisible();

  await page.fill('input[name="date"]', "2026-12-10");
  await page.fill('input[name="prixEuros"]', "200");
  await page.getByRole("button", { name: "Enregistrer le prix" }).click();
  await expect(
    page.getByText("Prix du 2026-12-10 enregistré"),
  ).toBeVisible();
  await expect(page.getByText("200,00 €").first()).toBeVisible();

  await page.fill('input[name="dateDebutPrix"]', "2026-12-20");
  await page.fill('input[name="dateFinPrix"]', "2026-12-22");
  await page.fill('input[name="prixPlageEuros"]', "150");
  await page.getByRole("button", { name: "Appliquer les prix" }).click();
  await expect(page.getByText("Prix appliqués sur la plage.")).toBeVisible();
  await expect(page.getByText("150,00 €").first()).toBeVisible();

  await page.selectOption('select[name="plan"]', { label: "Tarif de base" });
  await page.getByRole("button", { name: "Afficher" }).click();
  await expect(page.getByText("200,00 €")).toHaveCount(0);
  await expect(page.getByText("150,00 €")).toHaveCount(0);

  await page.selectOption('select[name="plan"]', {
    label: "Non remboursable",
  });
  await page.getByRole("button", { name: "Afficher" }).click();
  await expect(page.getByText("200,00 €").first()).toBeVisible();

  await page.fill('input[name="dateRegle"]', "2026-12-11");
  await page.fill('input[name="sejourMin"]', "3");
  await page.getByRole("button", { name: "Enregistrer la règle" }).click();
  await expect(page.getByText("Règle de séjour enregistrée.")).toBeVisible();
  await expect(page.getByText("min 3 nuits").first()).toBeVisible();

  await page.selectOption('select[name="plan"]', { label: "Tarif de base" });
  await page.getByRole("button", { name: "Afficher" }).click();
  await expect(page.getByText("min 3 nuits")).toHaveCount(0);

  await page.selectOption('select[name="plan"]', {
    label: "Non remboursable",
  });
  await page.getByRole("button", { name: "Afficher" }).click();
  const configuration = page.locator("details").filter({ hasText: "Configurer" });
  await configuration.locator("summary").click();
  await configuration
    .locator('input[name="externalRatePlanId"]')
    .fill(`rp2-${suffix}`);
  await configuration
    .getByRole("button", { name: "Enregistrer le plan" })
    .click();
  await expect(page.getByText("Plan tarifaire mis à jour.")).toBeVisible();
  await expect(page.getByText(`rate plan rp2-${suffix}`)).toBeVisible();

  await page.getByRole("button", { name: "Désactiver" }).click();
  await expect(
    page.getByRole("button", { name: "Activer", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Activer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Désactiver", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(
    page.getByText(/Ce plan porte encore des tarifs ou des restrictions/),
  ).toBeVisible();
});

test("plan dérivé : prix ajusté et règles héritées", async ({ page }) => {
  const suffix = Date.now();
  const code = `derive-e2e-${suffix}`;
  const nom = `Logement dérivé ${suffix}`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/logements");
  await page.fill('input[name="code"]', code);
  await page.fill('input[name="nom"]', nom);
  await page.getByRole("button", { name: "Créer le logement" }).click();
  await expect(page.getByText(`Logement « ${code} » créé.`)).toBeVisible();

  await page.goto("/hote/prix?mois=2026-12");
  await page.selectOption('select[name="logement"]', { label: nom });
  await page.getByRole("button", { name: "Afficher" }).click();

  await page.fill('input[name="date"]', "2026-12-12");
  await page.fill('input[name="prixEuros"]', "100");
  await page.getByRole("button", { name: "Enregistrer le prix" }).click();
  await expect(
    page.getByText("Prix du 2026-12-12 enregistré"),
  ).toBeVisible();

  await page.fill('input[name="dateRegle"]', "2026-12-12");
  await page.fill('input[name="sejourMin"]', "2");
  await page.getByRole("button", { name: "Enregistrer la règle" }).click();
  await expect(page.getByText("Règle de séjour enregistrée.")).toBeVisible();

  await page.fill('input[name="nom"]', "Dérivé");
  await page.fill('input[name="code"]', `derive-${suffix}`);
  await page.fill('input[name="externalRatePlanId"]', `rp-derive-${suffix}`);
  await page.selectOption('select[name="mode"]', "derive");
  await page.fill('input[name="ajustementPourcentage"]', "-10");
  await page.getByRole("button", { name: "Créer le plan" }).click();
  await expect(page.getByText("Plan tarifaire créé.")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Définir un prix — Dérivé/ }),
  ).toBeVisible();
  await expect(page.getByText("90,00 €").first()).toBeVisible();
  await expect(page.getByText("min 2 nuits").first()).toBeVisible();
});

test("prix + planning : création, anti-chevauchement", async ({ page }) => {
  const suffix = Date.now();
  const code = `plan-e2e-${suffix}`;
  const nom = `Planning E2E ${suffix}`;
  const ref = `resa-e2e-${suffix}`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  // 1. Un logement dédié au test.
  await page.goto("/hote/logements");
  await page.fill('input[name="code"]', code);
  await page.fill('input[name="nom"]', nom);
  await page.getByRole("button", { name: "Créer le logement" }).click();
  await expect(page.getByText(`Logement « ${code} » créé.`)).toBeVisible();

  // 2. Prix du 2026-11-15.
  await page.goto("/hote/prix?mois=2026-11");
  await page.selectOption('select[name="logement"]', { label: nom });
  await page.getByRole("button", { name: "Afficher" }).click();
  await expect(page.getByText(nom, { exact: false }).first()).toBeVisible();

  await page.fill('input[name="date"]', "2026-11-15");
  await page.fill('input[name="prixEuros"]', "150");
  await page.getByRole("button", { name: "Enregistrer le prix" }).click();
  await expect(
    page.getByText("Prix du 2026-11-15 enregistré"),
  ).toBeVisible();
  await expect(page.getByText("150,00 €").first()).toBeVisible();

  // 3. Cut-off et délai de préparation du logement.
  await page.waitForTimeout(500);
  const cutoffForm = page.locator('form[action="?/definirCutoff"]');
  await cutoffForm.locator('input[name="cutoffJours"]').fill("2");
  await cutoffForm.locator('button[type="submit"]').click();
  await expect(
    page.getByText("Délai minimum avant arrivée enregistré."),
  ).toBeVisible();
  await expect(page.locator('input[name="cutoffJours"]')).toHaveValue("2");

  await page.waitForTimeout(500);
  const bufferForm = page.locator('form[action="?/definirBuffer"]');
  await bufferForm.locator('input[name="bufferJours"]').fill("1");
  await bufferForm.locator('button[type="submit"]').click();
  await expect(page.getByText("Délai de préparation enregistré.")).toBeVisible();
  await expect(page.locator('input[name="bufferJours"]')).toHaveValue("1");

  // 4. Règle de séjour sur le 16, puis suppression.
  await page.fill('input[name="dateRegle"]', "2026-11-16");
  await page.fill('input[name="sejourMin"]', "2");
  await page.selectOption('select[name="arriveeAutorisee"]', "false");
  await page.selectOption('select[name="stopSell"]', "true");
  await page.getByRole("button", { name: "Enregistrer la règle" }).click();
  await expect(page.getByText("Règle de séjour enregistrée.")).toBeVisible();
  await expect(
    page.getByText("min 2 nuits · arrivée interdite · vente arrêtée"),
  ).toBeVisible();

  await page.fill('input[name="dateRegle"]', "2026-11-16");
  await page.getByRole("button", { name: "Effacer cette date" }).click();
  await expect(page.getByText("Règle de séjour supprimée.")).toBeVisible();
  await expect(
    page.getByText("min 2 nuits · arrivée interdite · vente arrêtée"),
  ).toHaveCount(0);

  // 4. Règle sur une plage de trois jours, puis suppression.
  await page.fill('input[name="dateRegle"]', "2026-11-20");
  await page.fill('input[name="dateFinRegle"]', "2026-11-22");
  await page.fill('input[name="sejourMin"]', "3");
  await page.getByRole("button", { name: "Enregistrer la règle" }).click();
  await expect(
    page.getByText("Règles de séjour enregistrées sur la plage."),
  ).toBeVisible();
  await expect(page.getByText("min 3 nuits")).toHaveCount(3);

  await page.fill('input[name="dateRegle"]', "2026-11-20");
  await page.fill('input[name="dateFinRegle"]', "2026-11-22");
  await page.getByRole("button", { name: "Effacer cette date" }).click();
  await expect(
    page.getByText("Règles de séjour supprimées sur la plage."),
  ).toBeVisible();
  await expect(page.getByText("min 3 nuits")).toHaveCount(0);

  // 5. Réservation du 15 au 18 novembre.
  await page.goto("/hote/planning?mois=2026-11");
  await page.selectOption('select[name="logement"]', { label: nom });
  await page.getByRole("button", { name: "Afficher" }).click();

  await page.fill('input[name="ref"]', ref);
  await page.fill('input[name="clientNom"]', "Client E2E");
  await page.fill('input[name="debut"]', "2026-11-15");
  await page.fill('input[name="fin"]', "2026-11-18");
  await page.fill('input[name="montantEuros"]', "450");
  await page.getByRole("button", { name: "Créer la réservation" }).click();
  await expect(
    page.getByText(`Réservation ${ref} créée`),
  ).toBeVisible();
  await expect(page.getByText(ref).first()).toBeVisible();

  // 5. Chevauchement refusé.
  await page.fill('input[name="ref"]', `${ref}-bis`);
  await page.fill('input[name="debut"]', "2026-11-16");
  await page.fill('input[name="fin"]', "2026-11-19");
  await page.getByRole("button", { name: "Créer la réservation" }).click();
  await expect(
    page.getByText("Ce logement est déjà occupé sur cette période."),
  ).toBeVisible();

  // 6. Export ICS signé du logement.
  await page.goto("/hote/logements");
  const ligneLogement = page.locator("li").filter({ hasText: nom });
  await ligneLogement
    .getByRole("link", { name: "Calendrier", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Abonnement calendrier" }),
  ).toBeVisible();

  const lienIcs = await page
    .locator('a[href*="/api/calendrier/"]')
    .getAttribute("href");
  expect(lienIcs).toBeTruthy();
  const ics = await page.request.get(lienIcs ?? "");
  expect(ics.status()).toBe(200);
  expect(ics.headers()["content-type"]).toContain("text/calendar");
  const corps = await ics.text();
  expect(corps).toContain("BEGIN:VCALENDAR");
  expect(corps).toContain("DTSTART;VALUE=DATE:20261115");
  expect(corps).toContain("DTEND;VALUE=DATE:20261118");
  expect(corps).toContain(`SUMMARY:Réservation ${ref}`);
  expect(corps).not.toContain("Client E2E");

  const invalide = await page.request.get(`${lienIcs}x`);
  expect(invalide.status()).toBe(401);
});
