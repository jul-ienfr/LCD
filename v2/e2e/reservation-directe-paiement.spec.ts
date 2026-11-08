import { expect, test } from "@playwright/test";
import postgres from "postgres";

const SLUG = "reservation-e2e";
const REF = "DIR-E2E-0001";

let sql: ReturnType<typeof postgres> | null = null;

test.describe("réservation directe et paiement sans JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test.beforeAll(async () => {
    const url =
      process.env.MIGRATION_DATABASE_URL ??
      process.env.DATABASE_URL ??
      "postgres://lcd:lcd@127.0.0.1:5432/lcd";
    sql = postgres(url, { max: 1, prepare: false });

    await sql`delete from tenants where slug = ${SLUG}`;
    const [tenant] = (await sql`
      insert into tenants (slug, nom, adresse)
      values (${SLUG}, 'Démo Paiement E2E', '2 rue du Test, 17000 La Rochelle')
      returning id
    `) as [{ id: string }];
    const [logement] = (await sql`
      insert into logements (tenant_id, code, nom, publication)
      values (${tenant.id}, 'E2E-1', 'Villa Paiement', 'publie')
      returning id
    `) as [{ id: string }];
    const [reservation] = (await sql`
      insert into reservations
        (tenant_id, logement_id, ref, client_nom, client_email, voyageurs,
         debut, fin, statut, montant_centimes, source)
      values
        (${tenant.id}, ${logement.id}, ${REF}, 'Camille Test',
         'camille@example.test', 2, '2027-01-10', '2027-01-17', 'confirmee',
         120000, 'utm:instagram/cpc/ete')
      returning id
    `) as [{ id: string }];
    await sql`
      insert into echeances_paiement
        (tenant_id, reservation_id, type, montant_centimes, exigible_le, statut)
      values
        (${tenant.id}, ${reservation.id}, 'acompte', 36000, '2026-12-01', 'a_payer'),
        (${tenant.id}, ${reservation.id}, 'solde', 84000, '2026-12-11', 'a_payer')
    `;
  });

  test.afterAll(async () => {
    if (!sql) return;
    await sql`delete from tenants where slug = ${SLUG}`;
    await sql.end();
    sql = null;
  });

  test("affiche les échéances de la réservation", async ({ page }) => {
    const reponse = await page.goto(
      `/reserver/${REF}?tenant=${SLUG}`,
    );
    expect(reponse?.status()).toBe(200);

    await expect(page.getByRole("heading", { name: "Votre séjour" })).toBeVisible();
    await expect(page.getByText(REF)).toBeVisible();
    await expect(page.getByText("Acompte", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Solde", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Échéance du 2026-12-01")).toBeVisible();
  });

  test("propose le paiement ou explique qu'il est indisponible", async ({
    page,
  }) => {
    await page.goto(`/reserver/${REF}?tenant=${SLUG}`);
    const payer = page.getByRole("button", { name: "Payer" });
    const indisponible = page.getByText("Paiement en ligne bientôt disponible");
    await expect(payer.or(indisponible).first()).toBeVisible();
  });

  test("refuse une réservation inconnue proprement", async ({ page }) => {
    const reponse = await page.goto(`/reserver/DIR-INCONNU?tenant=${SLUG}`);
    expect(reponse?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "Réservation introuvable" }),
    ).toBeVisible();
  });

  test("l'endpoint de paiement répond sans fuite de secret", async ({
    request,
  }) => {
    const reponse = await request.post(`/reserver/${REF}/checkout`, {
      form: { tenant: SLUG },
    });
    expect([200, 503, 502]).toContain(reponse.status());
    const corps = await reponse.text();
    expect(corps).not.toContain("sk_");
    expect(corps).not.toContain("whsec_");
  });
});
