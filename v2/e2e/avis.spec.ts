import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("avis : dépôt voyageur sans JS, unicité et modération hôte", async ({
  page,
  browser,
}) => {
  const suffix = Date.now();
  const code = `avis-e2e-${suffix}`;
  const nomLogement = `Logement Avis E2E ${suffix}`;
  const refResa = `resa-avis-${suffix}`;
  const nomVoyageur = `Marie Avis ${suffix}`;
  const commentaire = `Séjour très agréable ${suffix}`;

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
  await page.fill('input[name="clientNom"]', nomVoyageur);
  await page.fill('input[name="debut"]', "2026-12-10");
  await page.fill('input[name="fin"]', "2026-12-14");
  await page.fill('input[name="montantEuros"]', "600");
  await page.getByRole("button", { name: "Créer la réservation" }).click();
  await expect(page.getByText(`Réservation ${refResa} créée`)).toBeVisible();

  const section = page
    .locator("section")
    .filter({ hasText: "Réservations du mois" });
  const href = await section
    .locator("li")
    .filter({ hasText: refResa })
    .first()
    .getByRole("link", { name: "Lien voyageur" })
    .getAttribute("href");
  expect(href).toContain("/voyageur?t=");

  const noJs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const voyageur = await noJs.newPage();
  await voyageur.goto(href ?? "/voyageur");

  await expect(
    voyageur.getByRole("heading", { name: "Votre avis" }),
  ).toBeVisible();
  await expect(voyageur.getByText("Votre avis")).toBeVisible();
  await voyageur.fill('input[name="nom"]', nomVoyageur);
  await voyageur.selectOption('select[name="note"]', "4");
  await voyageur.fill('textarea[name="commentaire"]', commentaire);
  await voyageur.getByRole("button", { name: "Publier mon avis" }).click();
  await expect(voyageur.getByText("Merci pour votre avis.")).toBeVisible();

  await voyageur.goto(href ?? "/voyageur");
  await expect(
    voyageur.getByText("Vous avez déjà laissé un avis pour ce séjour."),
  ).toBeVisible();
  await expect(voyageur.getByText(commentaire)).toBeVisible();

  await voyageur.goto("/reserver?tenant=lcd");
  const carte = voyageur
    .locator("li")
    .filter({ hasText: nomLogement })
    .first();
  await expect(carte).toContainText("4/5 · 1 avis");
  await carte.getByRole("link", { name: "Voir les disponibilités" }).click();
  await expect(
    voyageur.getByRole("heading", { name: "Avis voyageurs" }),
  ).toBeVisible();
  await expect(voyageur.getByText(nomVoyageur).first()).toBeVisible();
  await expect(voyageur.getByText(commentaire)).toBeVisible();
  const urlDetail = voyageur.url();
  await noJs.close();

  await page.goto("/hote/avis");
  await expect(
    page.getByRole("heading", { name: "Avis voyageurs" }),
  ).toBeVisible();

  const ligne = page.locator("li").filter({ hasText: nomVoyageur }).first();
  await expect(ligne).toContainText(commentaire);
  await expect(ligne).toContainText(nomLogement);
  await expect(ligne).toContainText("Publié");

  await ligne.getByRole("button", { name: "Masquer" }).click();
  await expect(page.getByText("Avis mis à jour.")).toBeVisible();
  const ligneMasquee = page
    .locator("li")
    .filter({ hasText: nomVoyageur })
    .first();
  await expect(
    ligneMasquee.getByRole("button", { name: "Publier" }),
  ).toBeVisible();
  await expect(ligneMasquee).toContainText("Masqué");

  await page.goto("/reserver?tenant=lcd");
  const carteMasquee = page
    .locator("li")
    .filter({ hasText: nomLogement })
    .first();
  await expect(carteMasquee).not.toContainText("4/5 · 1 avis");

  await page.goto(urlDetail);
  await expect(
    page.getByRole("heading", { name: "Avis voyageurs" }),
  ).toHaveCount(0);
  await expect(page.getByText(commentaire)).toHaveCount(0);
});
