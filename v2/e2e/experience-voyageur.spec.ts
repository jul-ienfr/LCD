import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";
import postgres from "postgres";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";
const SECRET = process.env.BETTER_AUTH_SECRET ?? "";

let sql: ReturnType<typeof postgres> | null = null;

const SUFFIX = Date.now();
const CODE_LOGEMENT = `voyage-e2e-${SUFFIX}`;
const NOM_LOGEMENT = `Logement Voyageur E2E ${SUFFIX}`;
const REF_RESERVATION = `resa-voyage-${SUFFIX}`;
const REF_AVIS = `avis-voyage-${SUFFIX}`;

type Contexte = {
  tenantId: string;
  logementId: string;
  reservationId: string;
};

/**
 * Le lien guide est signé par HMAC (même contrat que `creerLienGuide`) : le
 * test forge donc un jeton avec le secret local, exactement comme le fait le
 * planificateur de messages, sans dépendre d'un envoi réel.
 */
function lienGuide(contexte: Contexte, options: { exp?: number } = {}): string {
  const charge = Buffer.from(
    JSON.stringify({
      v: 1,
      tenantId: contexte.tenantId,
      logementId: contexte.logementId,
      reservationId: contexte.reservationId,
      exp: options.exp ?? Math.floor(Date.now() / 1000) + 3600,
    }),
    "utf8",
  ).toString("base64url");
  const signature = createHmac("sha256", SECRET).update(charge).digest("base64url");
  return `${charge}.${signature}`;
}

async function connecter(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);
  // La redirection cliente post-login peut interrompre une navigation
  // immédiate (`ERR_ABORTED`) : on attend que la coquille staff soit rendue.
  await expect(
    page.getByRole("navigation", { name: "Navigation principale" }),
  ).toBeVisible();
}

/** Navigation robuste : rejoue en cas d'`ERR_ABORTED` du routeur client. */
async function aller(page: import("@playwright/test").Page, url: string) {
  await expect(async () => {
    await page.goto(url, { waitUntil: "domcontentloaded" });
  }).toPass({ timeout: 20_000 });
}

async function contexte(): Promise<Contexte> {
  const [logement] = (await sql!`
    select id, tenant_id from logements where code = ${CODE_LOGEMENT}
  `) as [{ id: string; tenant_id: string }];
  const [reservation] = (await sql!`
    select id from reservations
    where tenant_id = ${logement.tenant_id} and ref = ${REF_RESERVATION}
  `) as [{ id: string }];
  return {
    tenantId: logement.tenant_id,
    logementId: logement.id,
    reservationId: reservation.id,
  };
}

test.beforeAll(async () => {
  // Rôle propriétaire : le rôle applicatif est soumis au RLS et ne voit rien
  // sans `app.tenant_id` — le test lit donc l'état avec le rôle de migration.
  const url =
    process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  sql = postgres(url, { max: 1, prepare: false });
});

test.afterAll(async () => {
  if (sql) {
    const [logement] = (await sql`
      select tenant_id from logements where code = ${CODE_LOGEMENT}
    `) as [{ tenant_id: string }?];
    if (logement) {
      // Les tables métier sont supprimées en cascade avec le tenant… sauf le
      // logement lui-même : on retire d'abord les lignes créées par le test.
      await sql`delete from avis_voyageur where tenant_id = ${logement.tenant_id} and ref = ${REF_AVIS}`;
      await sql`delete from demandes_extra where tenant_id = ${logement.tenant_id}`;
      await sql`delete from acces_serrure where tenant_id = ${logement.tenant_id}`;
      await sql`delete from guide_contenus where tenant_id = ${logement.tenant_id}`;
      await sql`delete from reservations where tenant_id = ${logement.tenant_id} and ref = ${REF_RESERVATION}`;
      await sql`delete from logements where tenant_id = ${logement.tenant_id} and code = ${CODE_LOGEMENT}`;
    }
    await sql.end();
  }
});

test("guide signé : section publiée lisible sans compte, jeton falsifié refusé", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await connecter(page);

  // 1. Logement + réservation de référence
  await aller(page, "/hote/logements");
  await page.fill('input[name="code"]', CODE_LOGEMENT);
  await page.fill('input[name="nom"]', NOM_LOGEMENT);
  await page.getByRole("button", { name: "Créer le logement" }).click();
  await expect(page.getByText(`Logement « ${CODE_LOGEMENT} » créé.`)).toBeVisible();

  await page.goto("/hote/planning?mois=2026-11", {
    waitUntil: "domcontentloaded",
  });
  await page.selectOption('select[name="logement"]', { label: NOM_LOGEMENT });
  await page.getByRole("button", { name: "Afficher" }).click();
  await page.fill('input[name="ref"]', REF_RESERVATION);
  await page.fill('input[name="clientNom"]', "Voyageur Guide");
  await page.fill('input[name="debut"]', "2026-11-10");
  await page.fill('input[name="fin"]', "2026-11-14");
  await page.fill('input[name="montantEuros"]', "450");
  await page.getByRole("button", { name: "Créer la réservation" }).click();
  await expect(
    page.getByText(`Réservation ${REF_RESERVATION} créée`, { exact: false }),
  ).toBeVisible();

  const ctx = await contexte();

  // 2. Guide partenaire hébergé : lien configuré depuis la fiche logement
  await page.goto(`/hote/logements/${ctx.logementId}`, {
    waitUntil: "domcontentloaded",
  });
  await page.fill('input[name="guidePartenaireNom"]', "Guide Touch Stay");
  await page.fill(
    'input[name="guidePartenaireUrl"]',
    "https://guide.example.fr/demo",
  );
  await page.getByRole("button", { name: "Enregistrer le guide" }).click();
  await expect(
    page.getByText("Guide du logement enregistré.", { exact: false }),
  ).toBeVisible();

  // 3. Éditeur de guide : une section d'arrivée en français
  await page.goto(`/hote/logements/${ctx.logementId}/guide`, {
    waitUntil: "domcontentloaded",
  });
  const champTitre = page.locator('input[name="titre"]').first();
  const champCorps = page.locator('textarea[name="corps"]').first();
  // L'hydratation Svelte réinitialise les champs remplis avant elle : on
  // rejoue la saisie + l'enregistrement tant que la confirmation n'apparaît
  // pas (l'écriture est un upsert, donc idempotente).
  await expect(async () => {
    await champTitre.fill("Arrivée au logement");
    await champCorps.fill(
      "Sonner à l'interphone, la boîte à clés est à droite.",
    );
    await page.getByRole("button", { name: "Enregistrer Arrivée" }).click();
    await expect(
      page.getByText("Section « Arrivée » enregistrée", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 45_000 });

  // 4. Page publique du guide, sans compte
  await page.context().clearCookies();
  const token = lienGuide(ctx);
  await page.goto(`/guide/${token}`, { waitUntil: "domcontentloaded" });
  await expect(
    page.getByText("Arrivée au logement", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Sonner à l'interphone", { exact: false }),
  ).toBeVisible();
  const guidePartenaire = page.getByRole("link", {
    name: /Ouvrir le guide partenaire/,
  });
  await expect(guidePartenaire).toHaveAttribute(
    "href",
    "https://guide.example.fr/demo",
  );
  await expect(
    page.getByText("Guide Touch Stay", { exact: false }),
  ).toBeVisible();

  // 5. Jeton falsifié : rien du contenu ne doit fuiter
  await page.goto(`/guide/${token.slice(0, -3)}xyz`, {
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.getByText("Sonner à l'interphone", { exact: false }),
  ).toHaveCount(0);
  await expect(page.getByText(/indisponible|lien/i).first()).toBeVisible();

  // 5. Demande d'extra depuis le guide signé (sans compte, sans JS)
  await page.goto(`/guide/${token}`, { waitUntil: "domcontentloaded" });
  await page.selectOption('select[name="type"]', "depart-tardif");
  await page.fill('textarea[name="message"]', "Départ à 15 h, merci !");
  await page.getByRole("button", { name: "Envoyer la demande" }).click();
  await expect(page.getByText(/Départ tardif — \d/)).toBeVisible();
  await expect(
    page.getByText(/en attente|demandée|à valider/i).first(),
  ).toBeVisible();

  // 6. Validation staff de la demande d'extra
  await connecter(page);
  await aller(page, "/hote/demandes-extra");
  await expect(
    page.getByText("Départ tardif", { exact: false }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: /Valider/ }).first().click();
  await expect(page.getByText(/validée/i).first()).toBeVisible();

  // 7. Code d'accès lié à la réservation : visible dans le guide, puis révoqué
  await page.goto(`/hote/logements/${ctx.logementId}/serrure`, {
    waitUntil: "domcontentloaded",
  });
  const ligneReservation = page
    .locator("li")
    .filter({ hasText: REF_RESERVATION })
    .first();
  await ligneReservation.getByRole("button", { name: "Créer le code" }).click();
  const confirmation = page.getByText(/Code (?:manuel )?\d{6}/).first();
  await expect(confirmation).toBeVisible();
  const valeurCode =
    (await confirmation.innerText()).match(/(\d{6})/)?.[1] ?? "";

  // Le voyageur voit le code sur son guide signé, sans compte ni JavaScript.
  await page.context().clearCookies();
  await page.goto(`/guide/${token}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-code-acces]")).toBeVisible();
  await expect(page.locator("[data-code-acces]")).toContainText(valeurCode);

  // Le staff révoque le code avec un motif ; le guide ne l'affiche plus.
  await connecter(page);
  await page.goto(`/hote/logements/${ctx.logementId}/serrure`, {
    waitUntil: "domcontentloaded",
  });
  const ligneAcces = page
    .locator("li")
    .filter({ hasText: valeurCode })
    .first();
  await expect(ligneAcces).toBeVisible();
  await ligneAcces.locator('textarea[name="motif"]').fill("Séjour annulé");
  await ligneAcces.getByRole("button", { name: /Révoquer/ }).click();
  await expect(page.getByText(/révoqué/i).first()).toBeVisible();

  await page.context().clearCookies();
  await page.goto(`/guide/${token}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-code-acces]")).toHaveCount(0);

  // 8. Avis : dépôt par le voyageur, publication décidée par le staff
  await page.context().clearCookies();
  await page.goto(`/avis/${token}`, { waitUntil: "domcontentloaded" });
  await page.selectOption('select[name="note"]', "5");
  await page.fill(
    'textarea[name="commentaire"]',
    "Logement impeccable, arrivée très simple.",
  );
  await page.getByRole("button", { name: "Envoyer mon avis" }).click();
  await expect(
    page.getByText("Merci, votre avis a bien été enregistré.", { exact: false }),
  ).toBeVisible();

  await connecter(page);
  await page.goto("/hote/avis-voyageur", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByText("Logement impeccable", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Publier cet avis" }).first().click();
  await expect(page.getByText(/publié/i).first()).toBeVisible();
});
