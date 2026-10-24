import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";
const PROPRIO_EMAIL = process.env.SEED_PROPRIO_EMAIL ?? "proprio@lcd.test";
const PROPRIO_PASSWORD =
  process.env.SEED_PROPRIO_PASSWORD ?? "ChangeMe-2026!";

test("support : ticket propriétaire, réponse et résolution admin", async ({
  browser,
}) => {
  const suffix = Date.now();
  const sujet = `Problème WiFi ${suffix}`;
  const message = `Le WiFi ne fonctionne plus (${suffix}).`;

  const ctxProprio = await browser.newContext();
  const pageProprio = await ctxProprio.newPage();
  await pageProprio.goto("/login");
  await pageProprio.fill('input[type="email"]', PROPRIO_EMAIL);
  await pageProprio.fill('input[type="password"]', PROPRIO_PASSWORD);
  await pageProprio.getByRole("button", { name: "Se connecter" }).click();
  await expect(pageProprio).toHaveURL(/\/proprio$/);

  await pageProprio.goto("/support");
  await pageProprio.fill('input[name="sujet"]', sujet);
  await pageProprio.selectOption('select[name="priorite"]', "haute");
  await pageProprio.fill('textarea[name="message"]', message);
  await pageProprio.getByRole("button", { name: "Ouvrir le ticket" }).click();
  await expect(pageProprio.getByText(sujet).first()).toBeVisible();

  const ctxAdmin = await browser.newContext();
  const pageAdmin = await ctxAdmin.newPage();
  await pageAdmin.goto("/login");
  await pageAdmin.fill('input[type="email"]', ADMIN_EMAIL);
  await pageAdmin.fill('input[type="password"]', ADMIN_PASSWORD);
  await pageAdmin.getByRole("button", { name: "Se connecter" }).click();
  await expect(pageAdmin).toHaveURL(/\/hote$/);

  await pageAdmin.goto("/support");
  await pageAdmin.getByRole("link", { name: sujet }).click();
  await expect(pageAdmin.getByText(message).first()).toBeVisible();

  await pageAdmin.fill('textarea[name="message"]', "Nous regardons cela.");
  await pageAdmin.getByRole("button", { name: "Envoyer la réponse" }).click();
  await expect(pageAdmin.getByText("Réponse envoyée.")).toBeVisible();

  await pageAdmin.getByRole("button", { name: "Prendre en charge" }).click();
  await expect(pageAdmin.getByText("en_cours").first()).toBeVisible();
  await pageAdmin.getByRole("button", { name: "Marquer résolu" }).click();
  await expect(pageAdmin.getByText("resolu").first()).toBeVisible();

  await pageProprio.reload();
  await pageProprio.getByRole("link", { name: sujet }).click();
  await expect(pageProprio.getByText("Nous regardons cela.")).toBeVisible();
  await expect(pageProprio.getByText("resolu").first()).toBeVisible();

  await ctxProprio.close();
  await ctxAdmin.close();
});
