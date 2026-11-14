import { expect, test } from "@playwright/test";
import postgres from "postgres";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";
const SUFFIX = Date.now();
const CODE_LOGEMENT = `assist-fil-${SUFFIX}`;
const NOM_LOGEMENT = `Logement Assistant Fil ${SUFFIX}`;
const VOYAGEUR_EMAIL = `camille-assist-${SUFFIX}@example.test`;

let sql: ReturnType<typeof postgres> | null = null;

test.describe("assistant contextualisé par un fil", () => {
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

  test("génère un brouillon dans le fil avec audit et coût", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/login");
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/hote$/);

    await page.goto("/hote/logements");
    await page.fill('input[name="code"]', CODE_LOGEMENT);
    await page.fill('input[name="nom"]', NOM_LOGEMENT);
    await page.getByRole("button", { name: "Créer le logement" }).click();
    await expect(
      page.getByText(`Logement « ${CODE_LOGEMENT} » créé.`),
    ).toBeVisible();

    const [logement] = (await sql!`
      select id, tenant_id from logements where code = ${CODE_LOGEMENT}
    `) as [{ id: string; tenant_id: string }];
    const [fil] = (await sql!`
      insert into fils_voyageur
        (tenant_id, logement_id, voyageur_nom, voyageur_email, cle_regroupement, statut)
      values
        (${logement.tenant_id}, ${logement.id}, 'Camille Assistant',
         ${VOYAGEUR_EMAIL}, ${`email:${VOYAGEUR_EMAIL}`}, 'ouvert')
      returning id
    `) as [{ id: string }];
    await sql!`
      insert into messages_voyageur
        (tenant_id, logement_id, fil_id, ref, canal, sens, contenu, statut, expediteur)
      values
        (${logement.tenant_id}, ${logement.id}, ${fil.id},
         ${`ASSIST-IN-${SUFFIX}`}, 'email', 'entrant',
         'Bonjour, à quelle heure peut-on arriver vendredi ?', 'recu',
         ${VOYAGEUR_EMAIL})
    `;

    await page.goto(`/hote/messages/fils/${fil.id}`);
    const assistant = page
      .locator("section")
      .filter({ hasText: "Assistant de rédaction" })
      .first();
    await assistant.locator('select[name="intention"]').selectOption("arrivee");
    await assistant.locator('select[name="ton"]').selectOption("neutre");
    await assistant.locator('select[name="canal"]').selectOption("email");
    await assistant
      .locator('input[name="details"]')
      .fill("Préciser l’arrivée à partir de 15 h.");
    await assistant
      .getByRole("button", { name: "Rédiger un brouillon" })
      .click();

    await expect(
      page.getByText("Brouillon rédigé et ajouté au fil."),
    ).toBeVisible();
    await expect(page.getByText("votre séjour à", { exact: false })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Envoyer ce brouillon" }).last(),
    ).toBeVisible();

    const [message] = (await sql!`
      select ref, statut, contenu from messages_voyageur
      where fil_id = ${fil.id} and sens = 'sortant'
      order by created_at desc limit 1
    `) as [{ ref: string; statut: string; contenu: string }];
    expect(message.ref).toMatch(/^assist-arrivee-/);
    expect(message.statut).toBe("brouillon");
    expect(message.contenu).toContain("votre séjour à");

    const [consommation] = (await sql!`
      select modele, cout_centimes from assistant_consommations
      where tenant_id = ${logement.tenant_id}
      order by created_at desc limit 1
    `) as [{ modele: string; cout_centimes: number }];
    expect(consommation.cout_centimes).toBeGreaterThanOrEqual(0);
    expect(consommation.modele.length).toBeGreaterThan(0);

    const [audit] = (await sql!`
      select action, payload from audit_logs
      where tenant_id = ${logement.tenant_id} and action = 'assistant.fil'
      order by created_at desc limit 1
    `) as [{ action: string; payload: Record<string, unknown> }];
    expect(audit.action).toBe("assistant.fil");
    expect(audit.payload.messageId).toBeTruthy();
    expect(audit.payload.coutEstimeCentimes).toBeGreaterThanOrEqual(0);
  });
});
