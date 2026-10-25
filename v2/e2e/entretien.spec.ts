import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("carnet d’entretien : intervention, coût et historique", async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `ent-e2e-${suffix}`;
  const nomLogement = `Logement Entretien E2E ${suffix}`;
  const titre = `Mitigeur E2E ${suffix}`;

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

  await page.goto("/hote/entretien");
  await page.getByRole("link", { name: nomLogement, exact: true }).click();
  await page.waitForURL(/logement=/);

  await page.selectOption('select[name="type"]', "reparation");
  await page.fill('input[name="prestataire"]', "Plombier E2E");
  await page.fill('input[name="cout"]', "120");
  await page.fill('input[name="titre"]', titre);
  await page.fill(
    'textarea[name="description"]',
    "Remplacement du mitigeur de la douche.",
  );
  await page.getByRole("button", { name: /Enregistrer l/ }).click();

  await expect(page.getByText("Entretien enregistré.")).toBeVisible();
  await expect(
    page.getByText("Coût cumulé", { exact: true }),
  ).toBeVisible();

  const historique = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Historique" }) });
  const ligne = historique.locator("tbody tr").filter({ hasText: titre });
  await expect(ligne).toHaveCount(1);
  await expect(ligne).toContainText("Réparation");
  await expect(ligne).toContainText("Plombier E2E");
  await expect(ligne).toContainText(/120,00/);
  await expect(ligne).toContainText("Remplacement du mitigeur de la douche.");
});
