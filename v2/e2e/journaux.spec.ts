/**
 * FR-016 (spec 006) — journaux applicatifs consultables sans SSH.
 *
 * Preuve de bout en bout : une action serveur journalise une ligne
 * (`logInfo("cronReleves.fin", …)`, écrite inconditionnellement par le cron
 * des relevés), puis la page `/supervision/journaux` l'affiche — sans passer
 * par la console du serveur.
 *
 * L'insertion est en tâche de fond (best-effort) : on recharge la page dans
 * une attente bornée (`toPass`), jamais un `sleep` fixe.
 */
import { expect, test } from "@playwright/test";

const email = process.env.SEED_SUPER_ADMIN_EMAIL ?? "super@lcd.test";
const motDePasse =
  process.env.SEED_SUPER_ADMIN_PASSWORD ??
  process.env.SEED_ADMIN_PASSWORD ??
  "";
const CRON_SECRET = process.env.CRON_SECRET ?? "local-test-cron-secret-2026";

test.skip(
  !email || !motDePasse,
  "SEED_SUPER_ADMIN_EMAIL / SEED_SUPER_ADMIN_PASSWORD absents de .env.local",
);

test("les journaux applicatifs se consultent depuis la supervision", async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);

  // Déclencheur : le cron des relevés journalise son passage à chaque
  // exécution réussie (`cronReleves.fin`), quel que soit le résultat métier.
  const reponse = await request.get("/api/cron/releves?date=2026-12-01", {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
  expect(reponse.status()).toBe(200);

  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', motDePasse);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote/);

  await page.goto("/supervision/journaux");
  await expect(
    page.getByRole("heading", { name: "Journaux applicatifs" }),
  ).toBeVisible();

  // La ligne du cron est persistée puis affichée (insertion best-effort :
  // quelques centaines de ms peuvent séparer l'appel du cron de la lecture).
  await expect(async () => {
    await page.goto("/supervision/journaux?q=cronReleves");
    await expect(page.getByText("cronReleves.fin").first()).toBeVisible({
      timeout: 3_000,
    });
  }).toPass({ timeout: 30_000 });

  // Le filtre par niveau fonctionne : les erreurs sont listables à part.
  await page.goto("/supervision/journaux?niveau=error");
  await expect(page.getByText(/ligne\(s\) affichée\(s\)/)).toBeVisible();

  // La table est disponible : jamais le message de repli.
  await expect(
    page.getByText("Journaux indisponibles", { exact: false }),
  ).toHaveCount(0);
});
