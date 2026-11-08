import { expect, test } from "@playwright/test";
import postgres from "postgres";

const SLUG = "demande-e2e";

let sql: ReturnType<typeof postgres> | null = null;

const DEMANDE = {
  nom: "Camille Test",
  email: "camille@example.fr",
  telephone: "+33612345678",
  arrivee: "2027-06-01",
  depart: "2027-06-08",
  voyageurs: "3",
  message: "Lit bébé possible ?",
};

function compterDemandes(): Promise<number> {
  return sql!`
    select count(*)::int as n from demandes_sejour
    where tenant_id = (select id from tenants where slug = ${SLUG})
  `.then((lignes) => lignes[0]!.n as number);
}

test.describe("demande de séjour depuis le site public", () => {
  test.use({ javaScriptEnabled: false });

  test.beforeAll(async () => {
    const url =
      process.env.MIGRATION_DATABASE_URL ??
      process.env.DATABASE_URL ??
      "postgres://lcd:lcd@127.0.0.1:5432/lcd";
    sql = postgres(url, { max: 1, prepare: false });

    await sql`delete from tenants where slug = ${SLUG}`;
    const [tenant] = (await sql`
      insert into tenants (slug, nom)
      values (${SLUG}, 'Demande E2E')
      returning id
    `) as [{ id: string }];
    await sql`
      insert into logements (tenant_id, code, nom, statut)
      values (${tenant.id}, 'DEM-E2E-1', 'Villa Demande', 'actif')
    `;
    const [site] = (await sql`
      insert into sites_tenants (tenant_id, template, langues, seo_defaut, statut, publie_at)
      values (${tenant.id}, 'sejour', '["fr"]'::jsonb, '{}'::jsonb, 'publie', now())
      returning id
    `) as [{ id: string }];
    const [page] = (await sql`
      insert into pages_site
        (tenant_id, site_id, slug, type, template, statut, seo, langues, publie_at)
      values
        (${tenant.id}, ${site.id}, 'accueil', 'accueil', 'sejour', 'publie',
         ${JSON.stringify({ title: "Demande E2E" })}::jsonb,
         ${JSON.stringify({ fr: "Demandez vos dates" })}::jsonb, now())
      returning id
    `) as [{ id: string }];
    await sql`
      insert into sections_site (tenant_id, page_id, type, position, contenu, visible)
      values (${tenant.id}, ${page.id}, 'hero', 0,
        ${JSON.stringify({ titre: "Villa Demande" })}::jsonb, true)
    `;
  });

  test.afterAll(async () => {
    if (!sql) return;
    await sql`delete from tenants where slug = ${SLUG}`;
    await sql.end();
    sql = null;
  });

  test("affiche un formulaire de demande lisible sans JavaScript", async ({
    page,
  }) => {
    const reponse = await page.goto(`/site/${SLUG}`);
    expect(reponse?.status()).toBe(200);

    await expect(page.locator('form[action="?/demande"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Envoyer la demande" }),
    ).toBeVisible();
    await expect(page.locator('input[name="arrivee"]')).toBeVisible();
    await expect(page.locator('select[name="logementId"]')).toBeVisible();
  });

  test("enregistre une demande saisie dans le formulaire", async ({
    page,
  }) => {
    await sql!`delete from demandes_sejour
      where tenant_id = (select id from tenants where slug = ${SLUG})`;
    await page.goto(`/site/${SLUG}`);
    await page.fill('input[name="nom"]', DEMANDE.nom);
    await page.fill('input[name="email"]', DEMANDE.email);
    await page.fill('input[name="telephone"]', DEMANDE.telephone);
    await page.fill('input[name="arrivee"]', DEMANDE.arrivee);
    await page.fill('input[name="depart"]', DEMANDE.depart);
    await page.fill('input[name="voyageurs"]', DEMANDE.voyageurs);
    await page.fill('textarea[name="message"]', DEMANDE.message);
    await page.click('button[type="submit"]');

    await expect(page.locator("[role='status']")).toContainText(
      "Demande envoyée",
    );

    const lignes = await sql!`
      select d.ref, d.email, d.arrivee::text as arrivee, d.depart::text as depart,
             d.voyageurs, d.statut, d.message
      from demandes_sejour d
      join tenants t on t.id = d.tenant_id
      where t.slug = ${SLUG}
    `;
    expect(lignes).toHaveLength(1);
    expect(String(lignes[0]!.ref).startsWith("WEB-")).toBe(true);
    expect(lignes[0]!.email).toBe("camille@example.fr");
    expect(lignes[0]!.arrivee).toBe("2027-06-01");
    expect(lignes[0]!.depart).toBe("2027-06-08");
    expect(lignes[0]!.voyageurs).toBe(3);
    expect(lignes[0]!.statut).toBe("nouvelle");
  });

  test("rejoue le même envoi sans créer de doublon", async ({ request }) => {
    await sql!`delete from demandes_sejour
      where tenant_id = (select id from tenants where slug = ${SLUG})`;
    await request.post(`/site/${SLUG}?/demande`, { form: DEMANDE });
    const reponse = await request.post(`/site/${SLUG}?/demande`, {
      form: DEMANDE,
    });
    expect(reponse.status()).toBe(200);
    expect(await compterDemandes()).toBe(1);
  });

  test("refuse une demande sans email valide et n'écrit rien", async ({
    request,
  }) => {
    await sql!`delete from demandes_sejour
      where tenant_id = (select id from tenants where slug = ${SLUG})`;
    const reponse = await request.post(`/site/${SLUG}?/demande`, {
      form: { ...DEMANDE, email: "pas-un-email" },
    });
    expect(reponse.status()).toBe(400);
    expect(await compterDemandes()).toBe(0);
  });

  test("refuse des dates incohérentes", async ({ request }) => {
    await sql!`delete from demandes_sejour
      where tenant_id = (select id from tenants where slug = ${SLUG})`;
    const reponse = await request.post(`/site/${SLUG}?/demande`, {
      form: { ...DEMANDE, arrivee: "2027-06-08", depart: "2027-06-01" },
    });
    expect(reponse.status()).toBe(400);
    expect(await compterDemandes()).toBe(0);
  });
});
