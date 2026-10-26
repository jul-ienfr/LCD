import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("assistant : routage, brouillon et refus d’un code d’accès", async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `asst-e2e-${suffix}`;
  const nomLogement = `Loft Assistant E2E ${suffix}`;

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

  await page.goto("/hote/assistant");
  await page.getByRole("link", { name: nomLogement, exact: true }).click();
  await expect(page).toHaveURL(/logement=/);
  const logementId = new URL(page.url()).searchParams.get("logement");
  expect(logementId).toBeTruthy();
  await page.selectOption('select[name="intention"]', "arrivee");
  await page.selectOption('select[name="ton"]', "chaleureux");
  await page.fill('input[name="voyageur"]', "Camille");
  await page.fill(
    'textarea[name="details"]',
    "Arrivée possible dès 14 h, lit bébé installé.",
  );
  await page.getByRole("button", { name: "Rédiger le brouillon" }).click();

  await expect(
    page.getByRole("heading", { name: "Brouillon", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/standard ·/).first(),
  ).toBeVisible();
  const carteBrouillon = page
    .locator("article.bg-accent-douce")
    .filter({ hasText: "Bonjour Camille," });
  await expect(carteBrouillon).toBeVisible();
  await expect(carteBrouillon).toContainText(
    "14 h, lit bébé installé.",
  );
  await page.getByText("Prompt envoyé au modèle").click();
  await expect(page.getByText(/80 mots maximum/)).toBeVisible();

  await page
    .getByRole("button", { name: "Enregistrer dans les messages" })
    .click();
  await expect(page).toHaveURL(/\/hote\/messages/);
  await expect(page.getByText("Message préparé.")).toBeVisible();
  const ligneMessage = page
    .locator("li")
    .filter({ hasText: "Bonjour Camille, votre séjour" });
  await expect(ligneMessage).toBeVisible();
  await ligneMessage.getByRole("button", { name: "Marquer envoyé" }).click();
  await expect(page.getByText("Message marqué envoyé.")).toBeVisible();
  await expect(ligneMessage.getByText("Envoyé", { exact: true })).toBeVisible();

  await page.goto(`/hote/assistant?logement=${logementId}`);
  await page.fill(
    'textarea[name="details"]',
    "Le code d’accès est 4821, merci.",
  );
  await page.getByRole("button", { name: "Rédiger le brouillon" }).click();
  await expect(
    page.getByText(
      "Ne jamais inclure de code d’accès (PIN) dans un brouillon.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Brouillon", exact: true }),
  ).toHaveCount(0);

  await page.goto(
    `/hote/assistant?logement=${logementId}&intention=arrivee&voyageur=Camille&details=Arriv%C3%A9e%20d%C3%A8s%2014%20h.&comparer=1`,
  );
  await expect(
    page.getByRole("heading", { name: "Variante — Neutre" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Variante — Chaleureux" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Variante — Concis" }),
  ).toBeVisible();

  const carteConcis = page
    .locator("article")
    .filter({ hasText: "Variante — Concis" });
  await carteConcis
    .getByRole("button", { name: "Enregistrer dans les messages" })
    .click();
  await expect(page.getByText("Message préparé.")).toBeVisible();
  await expect(
    page.locator("li").getByText(/Bonjour Camille,.*À bientôt\./),
  ).toBeVisible();
});
