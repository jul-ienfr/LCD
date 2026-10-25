import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("login staff + création d'un logement + audit visible dans la liste", async ({
  page,
}) => {
  const code = `log-e2e-${Date.now()}`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/logements");
  await page.fill('input[name="code"]', code);
  await page.fill('input[name="nom"]', "Santa Severa E2E");
  await page.fill('input[name="adresse"]', "Saint-Laurent-du-Var");
  await page.getByRole("button", { name: "Créer le logement" }).click();

  await expect(
    page.getByText(`Logement « ${code} » créé.`),
  ).toBeVisible();
  await expect(page.getByText(code).first()).toBeVisible();

  // Le journal d'audit retrouve l'action par sa référence.
  await page.goto(`/hote/audit?q=${encodeURIComponent(code)}`);
  await expect(page.getByText("Logement créé")).toBeVisible();
  await expect(page.getByText(code).first()).toBeVisible();
  await expect(page.getByText("logement.creer")).toBeVisible();
});

test("voyageur sans JS, 320 px", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 800 },
  });
  const page = await context.newPage();

  await page.goto("/voyageur");
  await expect(
    page.getByRole("heading", { name: "Votre séjour" }),
  ).toBeVisible();
  await expect(page.getByText("Ouvrez le lien personnel")).toBeVisible();

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(false);

  await context.close();
});
