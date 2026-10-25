import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("questionnaire : dépôt voyageur, unicité et moyennes hôte", async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `qst-e2e-${suffix}`;
  const nomLogement = `Logement Questionnaire E2E ${suffix}`;
  const refResa = `qst-resa-${suffix}`;

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
  await page.fill('input[name="clientNom"]', "Voyageur Question");
  await page.fill('input[name="debut"]', "2026-12-01");
  await page.fill('input[name="fin"]', "2026-12-05");
  await page.fill('input[name="montantEuros"]', "500");
  await page.getByRole("button", { name: "Créer la réservation" }).click();
  await expect(page.getByText(`Réservation ${refResa} créée`)).toBeVisible();

  const section = page
    .locator("section")
    .filter({ hasText: "Réservations du mois" });
  const ligne = section.locator("li").filter({ hasText: refResa }).first();
  const href = await ligne
    .getByRole("link", { name: "Lien voyageur" })
    .getAttribute("href");
  const token = new URL(href ?? "", "http://localhost:3000").searchParams.get(
    "t",
  );
  expect(token).toBeTruthy();

  await page.goto(`/voyageur?t=${token}`);
  const lienQuestionnaire = page.getByRole("link", {
    name: "Répondre au questionnaire de séjour",
  });
  await expect(lienQuestionnaire).toBeVisible();
  await expect(lienQuestionnaire).toHaveAttribute(
    "href",
    `/questionnaire/${encodeURIComponent(token ?? "")}`,
  );

  await page.goto(`/questionnaire/${token}`);
  await expect(
    page.getByRole("heading", { name: nomLogement }),
  ).toBeVisible();
  await page.selectOption('select[name="note-accueil"]', "5");
  await page.selectOption('select[name="note-proprete"]', "4");
  await page.selectOption('select[name="note-equipement"]', "4");
  await page.selectOption('select[name="note-literie"]', "5");
  await page.selectOption('select[name="note-communication"]', "3");
  await page.fill(
    'textarea[name="commentaire"]',
    "Séjour très agréable, hôte réactif.",
  );
  await page.getByRole("button", { name: "Envoyer mes réponses" }).click();

  await expect(
    page.getByText("Merci, vos réponses sont enregistrées."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vos réponses" })).toBeVisible();
  await expect(page.getByText("4.2 / 5")).toBeVisible();
  await expect(
    page.getByText("Séjour très agréable, hôte réactif."),
  ).toBeVisible();

  await page.goto("/hote/questionnaires");
  await page.getByRole("link", { name: nomLogement, exact: true }).click();
  await page.waitForURL(/logement=/);
  await expect(page.getByText("4.2 / 5").first()).toBeVisible();

  const tableau = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Réponses" }) });
  const reponse = tableau.locator("tbody tr").first();
  await expect(reponse).toContainText("4.2");
  await expect(reponse).toContainText("Séjour très agréable, hôte réactif.");
});
