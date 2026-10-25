import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

test("dispatch : proposition, acceptation prestataire et assignation", async ({
  page,
  browser,
}) => {
  const suffix = Date.now();
  const code = `dsp-e2e-${suffix}`;
  const nomLogement = `Logement Dispatch E2E ${suffix}`;
  const nomPresta = `Presta Dispatch ${suffix}`;
  const emailPresta = `presta-dsp-${suffix}@lcd.test`;
  const motDePasse = `Provisoire-${suffix}!`;
  const refMission = `MIS-DSP-${suffix}`;
  const aujourdHui = new Date().toISOString().slice(0, 10);

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

  await page.goto("/hote/utilisateurs");
  await page.fill('input[name="name"]', nomPresta);
  await page.fill('input[name="email"]', emailPresta);
  await page.selectOption('select[name="role"]', "presta");
  await page.fill('input[name="password"]', motDePasse);
  await page.getByRole("button", { name: "Créer le compte" }).click();
  await expect(page.getByText(`Compte créé pour ${emailPresta}.`)).toBeVisible();

  await page.goto("/hote/missions");
  await page.selectOption('select[name="logementId"]', {
    label: `${nomLogement} (${code})`,
  });
  await page.selectOption('select[name="assignedUserId"]', {
    label: `${nomPresta} (${emailPresta})`,
  });
  await page.fill('input[name="ref"]', refMission);
  await page.fill('input[name="date"]', aujourdHui);
  await page.getByRole("button", { name: "Créer la mission" }).click();
  await expect(
    page.getByText(`Mission ${refMission} créée pour ${aujourdHui}.`),
  ).toBeVisible();

  await page.goto("/hote/dispatch");
  const ligne = page.locator("tbody tr").filter({ hasText: refMission });
  await ligne.locator('select[name="prestataireId"]').selectOption({
    label: nomPresta,
  });
  await ligne
    .locator('input[name="message"]')
    .fill("Créneau 8 h, clés dans la boîte.");
  await ligne.getByRole("button", { name: "Proposer" }).click();

  await expect(page.getByText("Offre envoyée au prestataire.")).toBeVisible();
  await expect(ligne.getByText("Proposée")).toBeVisible();
  await expect(
    ligne.getByText(nomPresta, { exact: true }).first(),
  ).toBeVisible();

  const contextePresta = await browser.newContext();
  const pagePresta = await contextePresta.newPage();
  await pagePresta.goto("/login");
  await pagePresta.fill('input[type="email"]', emailPresta);
  await pagePresta.fill('input[type="password"]', motDePasse);
  await pagePresta.getByRole("button", { name: "Se connecter" }).click();
  await expect(pagePresta).toHaveURL(/\/presta$/);

  await pagePresta.goto("/presta");
  await expect(pagePresta.getByText("Offres en attente (1)")).toBeVisible();
  await expect(pagePresta.getByText(refMission).first()).toBeVisible();
  await expect(pagePresta.getByText("Créneau 8 h, clés dans la boîte.")).toBeVisible();
  await pagePresta.getByRole("button", { name: "Accepter" }).click();
  await expect(pagePresta.getByText("Offres en attente (1)")).toHaveCount(0);
  await expect(pagePresta.getByText(refMission).first()).toBeVisible();
  await contextePresta.close();

  await page.goto("/hote/dispatch");
  const ligneApres = page.locator("tbody tr").filter({ hasText: refMission });
  await expect(ligneApres.getByText("Acceptée")).toBeVisible();
  const historique = page.locator("li").filter({ hasText: refMission });
  await expect(historique.getByText("Acceptée")).toBeVisible();
});
