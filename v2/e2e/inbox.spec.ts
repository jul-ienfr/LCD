import { expect, test } from "@playwright/test";
import postgres from "postgres";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

let sql: ReturnType<typeof postgres> | null = null;

const SUFFIX = Date.now();
const CODE_LOGEMENT = `fil-e2e-${SUFFIX}`;
const NOM_LOGEMENT = `Logement Fil E2E ${SUFFIX}`;
const VOYAGEUR_EMAIL = `camille-fil-${SUFFIX}@example.test`;
const VOYAGEUR_TEL = "+33612345699";

type Contexte = { tenantId: string; logementId: string; filId: string };

async function compterMessages(filId: string): Promise<number> {
  return sql!`
    select count(*)::int as n from messages_voyageur where fil_id = ${filId}
  `.then((lignes) => lignes[0]!.n as number);
}

async function statutDernierSortant(filId: string): Promise<string | null> {
  return sql!`
    select statut from messages_voyageur
    where fil_id = ${filId} and sens = 'sortant' and ref like 'MSG-%'
    order by created_at desc limit 1
  `.then((lignes) => (lignes[0]?.statut as string | undefined) ?? null);
}

async function statutMessage(ref: string): Promise<string | null> {
  return sql!`
    select statut from messages_voyageur where ref = ${ref}
  `.then((lignes) => (lignes[0]?.statut as string | undefined) ?? null);
}

async function connecter(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);
}

test.describe("inbox unifiée des fils voyageurs", () => {
  test.beforeAll(async () => {
    const url =
      process.env.MIGRATION_DATABASE_URL ??
      process.env.DATABASE_URL ??
      "postgres://lcd:lcd@127.0.0.1:5432/lcd";
    sql = postgres(url, { max: 1, prepare: false });
  });

  test.afterAll(async () => {
    if (!sql) return;
    await sql`
      delete from fils_voyageur
      where tenant_id = (
        select tenant_id from logements where code = ${CODE_LOGEMENT}
      )
    `;
    await sql`delete from logements where code = ${CODE_LOGEMENT}`;
    await sql.end();
    sql = null;
  });

  test("regroupe les messages, envoie une réponse et valide un brouillon", async ({
    page,
  }) => {
    await connecter(page);

    await page.goto("/hote/logements");
    await page.fill('input[name="code"]', CODE_LOGEMENT);
    await page.fill('input[name="nom"]', NOM_LOGEMENT);
    await page.getByRole("button", { name: "Créer le logement" }).click();
    await expect(page.getByText(`Logement « ${CODE_LOGEMENT} » créé.`)).toBeVisible();

    const [logement] = (await sql!`
      select id, tenant_id from logements where code = ${CODE_LOGEMENT}
    `) as [{ id: string; tenant_id: string }];
    const [fil] = (await sql!`
      insert into fils_voyageur
        (tenant_id, logement_id, voyageur_nom, voyageur_email, voyageur_telephone,
         cle_regroupement, statut)
      values
        (${logement.tenant_id}, ${logement.id}, 'Camille Fil E2E',
         ${VOYAGEUR_EMAIL}, ${VOYAGEUR_TEL},
         ${`email:${VOYAGEUR_EMAIL}`}, 'ouvert')
      returning id
    `) as [{ id: string }];
    const contexte: Contexte = {
      tenantId: logement.tenant_id,
      logementId: logement.id,
      filId: fil.id,
    };

    await sql!`
      insert into messages_voyageur
        (tenant_id, logement_id, fil_id, ref, canal, sens, contenu, statut, expediteur)
      values
        (${contexte.tenantId}, ${contexte.logementId}, ${contexte.filId},
         ${`E2E-IN-${SUFFIX}`}, 'email', 'entrant',
         'Bonjour, à quelle heure peut-on arriver vendredi ?', 'recu',
         ${VOYAGEUR_EMAIL})
    `;
    await sql!`
      insert into messages_voyageur
        (tenant_id, logement_id, fil_id, ref, canal, sens, contenu, statut, destinataire)
      values
        (${contexte.tenantId}, ${contexte.logementId}, ${contexte.filId},
         ${`E2E-AUTO-${SUFFIX}`}, 'email', 'sortant',
         'Bonjour Camille, votre séjour approche : arrivée à partir de 15 h.',
         'brouillon', ${VOYAGEUR_EMAIL})
    `;

    await page.goto(`/hote/messages/fils?recherche=${encodeURIComponent(VOYAGEUR_EMAIL)}`);
    await expect(page.getByText("Camille Fil E2E")).toBeVisible();
    const carte = page.locator("li").filter({ hasText: "Camille Fil E2E" }).first();    await expect(carte).toContainText("1 non lus");
    await expect(carte).toContainText("1 Brouillon");

    await page.getByRole("link", { name: "Ouvrir le fil" }).first().click();
    await page.waitForURL(/\/hote\/messages\/fils\/[0-9a-f-]+/);
    await expect(page.getByText("à quelle heure peut-on arriver")).toBeVisible();
    await expect(page.getByText("votre séjour approche")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Envoyer ce brouillon" }),
    ).toBeVisible();

    const refReponse = `E2E-OUT-${SUFFIX}`;
    void refReponse;
    await page.selectOption('select[name="canal"]', "email");    await page.fill('input[name="sujet"]', "Arrivée vendredi");
    await page.fill(
      'textarea[name="contenu"]',
      "Bonjour Camille, l'arrivée est possible à partir de 15 h. À vendredi !",
    );
    await page.getByRole("button", { name: "Envoyer", exact: true }).click();
    await expect(page.getByText("Message envoyé.")).toBeVisible();
    expect(await statutDernierSortant(contexte.filId)).toBe("envoye");

    const mailpit = await page.request.get(
      "http://127.0.0.1:8025/api/v1/messages?limit=100",
    );
    const corps = (await mailpit.json()) as {
      messages?: { To?: { Address?: string }[] }[];
    };
    expect(
      corps.messages?.some((m) =>
        m.To?.some((to) => to.Address === VOYAGEUR_EMAIL),
      ),
    ).toBe(true);

    await expect(page.getByText(/1 brouillon/i).first()).toBeVisible();
    await page.getByRole("button", { name: "Envoyer ce brouillon" }).click();
    await expect(page.getByText("Message envoyé.")).toBeVisible();
    expect(await statutMessage(`E2E-AUTO-${SUFFIX}`)).toBe("envoye");
    expect(await compterMessages(contexte.filId)).toBe(3);

    await page.goto(`/hote/messages/fils?recherche=${encodeURIComponent(VOYAGEUR_EMAIL)}`);
    await page.waitForLoadState("networkidle");
    const carteAssignation = page
      .locator("li")
      .filter({ hasText: "Camille Fil E2E" })
      .first();
    await carteAssignation.locator('input[name="assigneA"]').fill(ADMIN_EMAIL);
    await expect(carteAssignation.locator('input[name="assigneA"]')).toHaveValue(
      ADMIN_EMAIL,
    );
    await carteAssignation.getByRole("button", { name: "Assigner" }).click();
    await expect(page.getByText("Statut du fil mis à jour.")).toBeVisible();
    const [assigne] = (await sql!`
      select assigne_a from fils_voyageur where id = ${contexte.filId}
    `) as [{ assigne_a: string | null }];
    expect(assigne.assigne_a).toBe(ADMIN_EMAIL);
  });
});
