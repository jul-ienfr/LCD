import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";
const MAILPIT = "http://127.0.0.1:8025";

test("mot de passe oublié : lien email, réinitialisation et sessions fermées", async ({
  page,
  browser,
}) => {
  const mailpit = await fetch(`${MAILPIT}/api/v1/info`)
    .then((reponse) => reponse.ok)
    .catch(() => false);
  test.skip(!mailpit, "Mailpit n’est pas disponible en local.");

  const suffix = Date.now();
  const email = `oubli-${suffix}@lcd.test`;
  const ancien = `Ancien-${suffix}!`;
  const nouveau = `Nouveau-${suffix}!`;

  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);

  await page.goto("/hote/utilisateurs");
  await page.fill('input[name="name"]', `Oubli E2E ${suffix}`);
  await page.fill('input[name="email"]', email);
  await page.selectOption('select[name="role"]', "hote");
  await page.fill('input[name="password"]', ancien);
  await page.getByRole("button", { name: "Créer le compte" }).click();
  await expect(page.getByText(`Compte créé pour ${email}.`)).toBeVisible();

  const contexte = await browser.newContext();
  const pageUtilisateur = await contexte.newPage();
  await pageUtilisateur.goto("/login");
  await pageUtilisateur.fill('input[type="email"]', email);
  await pageUtilisateur.fill('input[type="password"]', ancien);
  await pageUtilisateur.getByRole("button", { name: "Se connecter" }).click();
  await expect(pageUtilisateur).toHaveURL(/\/hote$/);

  await page.goto("/mot-de-passe-oublie");
  await page.fill('input[type="email"]', email);
  await page.getByRole("button", { name: "Envoyer le lien" }).click();
  await expect(
    page.getByText(/Si un compte existe avec cette adresse/),
  ).toBeVisible();

  let lien: string | undefined;
  for (let essai = 0; essai < 20 && !lien; essai += 1) {
    const liste = await fetch(`${MAILPIT}/api/v1/messages?limit=100`).then(
      (reponse) =>
        reponse.json() as Promise<{
          messages?: { ID: string; To?: { Address?: string }[] }[];
        }>,
    );
    const message = liste.messages?.find((candidat) =>
      candidat.To?.some((destinataire) => destinataire.Address === email),
    );
    if (message) {
      const detail = await fetch(
        `${MAILPIT}/api/v1/message/${message.ID}`,
      ).then((reponse) =>
        reponse.json() as Promise<{ Text?: string; HTML?: string }>,
      );
      const contenu = `${detail.Text ?? ""}\n${detail.HTML ?? ""}`;
      lien = contenu.match(
        /https?:\/\/[^\s"'<>]+\/reset-password\/[^\s"'<>]+/,
      )?.[0];
    }
    if (!lien) await page.waitForTimeout(500);
  }
  expect(lien, "lien de réinitialisation reçu par email").toBeTruthy();

  await pageUtilisateur.goto(lien ?? "");
  await expect(pageUtilisateur).toHaveURL(
    /\/reinitialiser-mot-de-passe\?token=/,
  );
  await pageUtilisateur.fill('input[type="password"]', nouveau);
  await pageUtilisateur
    .locator('input[type="password"]')
    .nth(1)
    .fill(nouveau);
  await pageUtilisateur
    .getByRole("button", { name: "Changer le mot de passe" })
    .click();
  await expect(
    pageUtilisateur.getByText(/Votre mot de passe a été modifié/),
  ).toBeVisible();

  await pageUtilisateur.goto("/hote");
  await expect(pageUtilisateur).toHaveURL(/\/login$/);

  await pageUtilisateur.goto("/login");
  await pageUtilisateur.fill('input[type="email"]', email);
  await pageUtilisateur.fill('input[type="password"]', nouveau);
  await pageUtilisateur.getByRole("button", { name: "Se connecter" }).click();
  await expect(pageUtilisateur).toHaveURL(/\/hote$/);

  await contexte.close();
});
