/**
 * FR-018 (spec 006) — création d'un espace complet depuis la supervision,
 * preuve de bout en bout, sans SSH.
 *
 * Le test crée un espace (tenant + compte admin + premier logement) depuis
 * `/supervision/espaces`, vérifie qu'il apparaît dans la liste, que
 * l'administrateur créé peut se connecter et arriver sur son tableau de bord,
 * puis qu'un second envoi du même slug est refusé proprement. Le nettoyage
 * (suppression du tenant, cascade sur comptes et logements) est dans un
 * `finally` : aucune donnée de test ne survit au run.
 */
import { expect, test } from "@playwright/test";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });

const email = process.env.SEED_SUPER_ADMIN_EMAIL ?? "super@lcd.test";
const motDePasse =
  process.env.SEED_SUPER_ADMIN_PASSWORD ??
  process.env.SEED_ADMIN_PASSWORD ??
  "";

test.skip(
  !email || !motDePasse,
  "SEED_SUPER_ADMIN_EMAIL / SEED_SUPER_ADMIN_PASSWORD absents de .env.local",
);

async function supprimerEspace(slug: string) {
  const url =
    process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) return;
  const sql = postgres(url, {
    max: 1,
    prepare: false,
    ssl: url.includes("sslmode=require") ? "require" : false,
  });
  try {
    await sql`delete from tenants where slug = ${slug}`;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

test("un espace complet se crée depuis la supervision, sans SSH", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  const suffix = Date.now();
  const slug = `espace-e2e-${suffix}`;
  const nom = `Espace E2E ${suffix}`;
  const adminEmail = `admin-${suffix}@lcd.test`;
  const adminMotDePasse = `Espace-E2E-${suffix}!`;
  const logementCode = `log-${suffix}`;

  try {
    // Connexion super-admin.
    await page.goto("/login");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', motDePasse);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/hote/);

    await page.goto("/supervision/espaces");
    await expect(
      page.getByRole("heading", { name: "Créer un espace" }),
    ).toBeVisible();

    // Création complète : tenant, admin et premier logement.
    await page.fill('input[name="slug"]', slug);
    await page.fill('input[name="nom"]', nom);
    await page.fill('input[name="adminNom"]', "Admin E2E");
    await page.fill('input[name="adminEmail"]', adminEmail);
    await page.fill('input[name="adminPassword"]', adminMotDePasse);
    await page.fill('input[name="logementCode"]', logementCode);
    await page.fill('input[name="logementNom"]', "Logement E2E");
    await page.fill('input[name="logementAdresse"]', "1 rue du Test");
    await page.getByRole("button", { name: "Créer l’espace" }).click();

    await expect(
      page.getByText(`Espace « ${nom} » créé (${slug}).`),
    ).toBeVisible();
    await expect(
      page.getByText(`Compte administrateur : ${adminEmail}`),
    ).toBeVisible();
    // L'espace rejoint la liste des espaces existants.
    await expect(page.getByText(`${slug} · créé le`)).toBeVisible();

    // Le doublon de slug est refusé proprement, sans écraser l'existant.
    await page.fill('input[name="slug"]', slug);
    await page.fill('input[name="nom"]', "Doublon");
    await page.fill('input[name="adminNom"]', "Admin Doublon");
    await page.fill('input[name="adminEmail"]', `autre-${suffix}@lcd.test`);
    await page.fill('input[name="adminPassword"]', adminMotDePasse);
    await page.fill('input[name="logementCode"]', `log-dup-${suffix}`);
    await page.fill('input[name="logementNom"]', "Logement doublon");
    await page.getByRole("button", { name: "Créer l’espace" }).click();
    await expect(
      page.getByText(`Le slug « ${slug} » est déjà utilisé.`),
    ).toBeVisible();
    // La saisie est conservée après l'erreur.
    await expect(page.locator('input[name="nom"]')).toHaveValue("Doublon");

    // L'administrateur créé se connecte et arrive sur son propre espace.
    const contexte = await browser.newContext();
    const pageAdmin = await contexte.newPage();
    await pageAdmin.goto("/login");
    await pageAdmin.fill('input[type="email"]', adminEmail);
    await pageAdmin.fill('input[type="password"]', adminMotDePasse);
    await pageAdmin.getByRole("button", { name: "Se connecter" }).click();
    await expect(pageAdmin).toHaveURL(/\/hote$/);

    // Son logement est bien là, dans son espace.
    await pageAdmin.goto("/hote/logements");
    await expect(pageAdmin.getByText(logementCode)).toBeVisible();
    await contexte.close();
  } finally {
    await supprimerEspace(slug);
  }
});
