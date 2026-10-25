import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("voyageur : lien signé, incident sans JS, idempotence et outbox", async ({
  page,
  browser,
}) => {
  const suffix = Date.now();
  const code = `voy-e2e-${suffix}`;
  const nom = `Voyageur E2E ${suffix}`;
  const refResa = `resa-voy-${suffix}`;

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

  await page.goto("/hote/planning?mois=2026-12");
  await page.selectOption('select[name="logement"]', { label: nom });
  await page.getByRole("button", { name: "Afficher" }).click();
  await page.fill('input[name="ref"]', refResa);
  await page.fill('input[name="clientNom"]', "Voyageur Test");
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
  expect(href).toContain("/voyageur?t=");

  const token = new URL(href ?? "", "http://localhost:3000").searchParams.get(
    "t",
  );
  expect(token).toBeTruthy();

  // 1. Sans JavaScript : le lien affiche les vraies données et le formulaire
  //    POST natif fonctionne.
  const noJs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 800 },
  });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(href ?? "/voyageur");
  await expect(noJsPage.getByText(nom)).toBeVisible();
  await expect(noJsPage.getByText(refResa)).toBeVisible();
  await expect(noJsPage.getByText("2026-12-01")).toBeVisible();
  await expect(noJsPage.getByText("2026-12-05")).toBeVisible();

  const message = `Fuite sous l'évier ${suffix}`;
  await noJsPage.fill('textarea[name="message"]', message);
  await noJsPage.getByRole("button", { name: "Envoyer" }).click();
  await expect(noJsPage.getByText("Signalement envoyé").first()).toBeVisible();
  await expect(noJsPage.getByText(message).first()).toBeVisible();
  await noJs.close();

  // 1bis. Version anglaise sans JS + retour au français.
  const noJsEn = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 800 },
  });
  const pageEn = await noJsEn.newPage();
  await pageEn.goto(`${href}&lang=en`);
  await expect(
    pageEn.getByRole("heading", { name: "Your stay" }),
  ).toBeVisible();
  await expect(pageEn.getByText("Accommodation guide")).toBeVisible();
  await expect(
    pageEn.getByRole("heading", { name: "Report an issue" }),
  ).toBeVisible();
  await pageEn.getByRole("link", { name: "FR" }).click();
  await expect(
    pageEn.getByRole("heading", { name: "Votre séjour" }),
  ).toBeVisible();
  await noJsEn.close();

  // 2. Même ref = idempotent côté API.
  const refApi = `inc-${suffix}`;
  const premier = await page.request.post("/api/voyageur/incident", {
    data: { token, ref: refApi, message: "Test API idempotent" },
  });
  expect(premier.status()).toBe(201);
  expect((await premier.json()).idempotent).toBe(false);

  const second = await page.request.post("/api/voyageur/incident", {
    data: { token, ref: refApi, message: "Test API idempotent" },
  });
  expect(second.status()).toBe(200);
  expect((await second.json()).idempotent).toBe(true);

  // 3. Outbox : hors ligne, mise en attente, rejeu au retour réseau.
  const jsContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const jsPage = await jsContext.newPage();
  await jsPage.goto(href ?? "/voyageur");
  await jsContext.setOffline(true);
  await jsPage.fill(
    'textarea[name="message"]',
    `Incident hors ligne ${suffix}`,
  );
  await jsPage.getByRole("button", { name: "Envoyer" }).click();
  await expect(
    jsPage.getByText("Hors ligne : signalement mis en attente"),
  ).toBeVisible();

  await jsContext.setOffline(false);
  await jsPage.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(jsPage.getByText("Signalement envoyé").first()).toBeVisible({
    timeout: 10_000,
  });
  await jsContext.close();
});
