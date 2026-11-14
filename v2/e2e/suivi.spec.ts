import { expect, test } from "@playwright/test";
import postgres from "postgres";

const SLUG = "suivi-e2e";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lcd.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";

let sql: ReturnType<typeof postgres> | null = null;
let tenantId = "";

test.beforeAll(async () => {
  const url =
    process.env.MIGRATION_DATABASE_URL ??
    process.env.DATABASE_URL ??
    "postgres://lcd:lcd@127.0.0.1:5432/lcd";
  sql = postgres(url, { max: 1, prepare: false });
  await sql`delete from tenants where slug = ${SLUG}`;
  const [tenant] = (await sql`
    insert into tenants (slug, nom)
    values (${SLUG}, 'Suivi E2E')
    returning id
  `) as [{ id: string }];
  tenantId = tenant.id;
  const [site] = (await sql`
    insert into sites_tenants
      (tenant_id, template, langues, seo_defaut, statut, publie_at)
    values
      (${tenantId}, 'ocean', ${JSON.stringify(["fr"])}::jsonb,
       ${JSON.stringify({ title: "Suivi E2E", description: "Test", ogImage: null })}::jsonb,
       'publie', now())
    returning id
  `) as [{ id: string }];
  const [page] = (await sql`
    insert into pages_site
      (tenant_id, site_id, slug, type, template, statut, seo, langues, publie_at)
    values
      (${tenantId}, ${site.id}, 'accueil', 'accueil', 'ocean', 'publie',
       ${JSON.stringify({ title: "Suivi E2E", description: "Test", ogImage: null })}::jsonb,
       ${JSON.stringify({ fr: "Accueil" })}::jsonb, now())
    returning id
  `) as [{ id: string }];
  await sql`
    insert into sections_site (tenant_id, page_id, type, position, contenu, visible)
    values (${tenantId}, ${page.id}, 'hero', 0,
      ${JSON.stringify({ titre: "Suivi E2E", sousTitre: "Test" })}::jsonb, true)
  `;
  await sql`
    insert into suivi_configuration (tenant_id, actif, configuration)
    values (${tenantId}, true, ${sql.json({
      mesure: { ga4Id: "G-E2E12345" },
      publicite: { metaPixelId: "123456789012345" },
    })})
  `;
});

test.afterAll(async () => {
  if (!sql) return;
  await sql`delete from tenants where slug = ${SLUG}`;
  await sql.end();
});

test("le consentement gate les traceurs et le journal first-party", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto(`/site/${SLUG}`);
  await expect(page.getByRole("region", { name: "Choix de suivi" })).toBeVisible();
  expect(await page.content()).not.toContain("googletagmanager.com/gtag");
  const avant = (await sql!`
    select count(*)::int as total from suivi_evenements where tenant_id = ${tenantId}
  `) as [{ total: number }];
  expect(avant[0]!.total).toBe(0);

  await page.getByRole("button", { name: "Tout accepter" }).click();
  await expect(page).toHaveURL(new RegExp(`/site/${SLUG}$`));
  await expect(page.locator("html")).toContainText("Suivi E2E");
  expect(await page.content()).toContain("googletagmanager.com/gtag/js?id=G-E2E12345");

  await expect
    .poll(async () => {
      const lignes = (await sql!`
        select type, ip_hash from suivi_evenements where tenant_id = ${tenantId}
      `) as { type: string; ip_hash: string | null }[];
      return lignes.length;
    })
    .toBeGreaterThan(0);
  const lignes = (await sql!`
    select type, ip_hash, page from suivi_evenements where tenant_id = ${tenantId}
  `) as { type: string; ip_hash: string | null; page: string }[];
  expect(lignes.some((ligne) => ligne.type === "page_vue")).toBe(true);
  expect(lignes[0]!.ip_hash).toMatch(/^[a-f0-9]{64}$/);
  expect(lignes[0]!.ip_hash).not.toBe("127.0.0.1");
});

test("l'API refuse sans consentement puis accepte un clic", async ({
  request,
}) => {
  const refuse = await request.post("/api/suivi", {
    data: {
      tenantSlug: SLUG,
      evenement: { type: "clic", page: `/site/${SLUG}`, nom: "Test" },
    },
  });
  expect(refuse.status()).toBe(403);

  const consentement = await request.post("/consentement?/tout", {
    form: { retour: `/site/${SLUG}` },
  });
  expect([200, 302, 303]).toContain(consentement.status());

  const accepte = await request.post("/api/suivi", {
    data: {
      tenantSlug: SLUG,
      evenement: {
        type: "clic",
        page: `/site/${SLUG}`,
        nom: "Réserver",
        metadata: { href: "/reserver" },
      },
    },
  });
  expect(accepte.status()).toBe(202);
  await expect
    .poll(async () => {
      const lignes = (await sql!`
        select count(*)::int as total from suivi_evenements
        where tenant_id = ${tenantId} and type = 'clic'
      `) as [{ total: number }];
      return lignes[0]!.total;
    })
    .toBeGreaterThan(0);
});

test("l'hôte accède à la configuration et au journal", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/hote$/);
  await page.waitForLoadState("networkidle");
  await page.goto("/hote/suivi", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Mesure d’audience et publicité" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Enregistrer" })).toBeVisible();
  await expect(page.locator("body")).toContainText("Derniers événements");
});
