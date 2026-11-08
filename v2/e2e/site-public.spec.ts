import { expect, test } from "@playwright/test";
import postgres from "postgres";

const SLUG = "demo-e2e";
const seo = {
  title: "Villa E2E — LCD",
  description:
    "Une villa de test pour vérifier le rendu public sans JavaScript et les métadonnées SEO.",
  ogImage: null,
};

let sql: ReturnType<typeof postgres> | null = null;

test.describe("site public sans JavaScript", () => {
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
      values (${SLUG}, 'Démo E2E', '1 rue du Test, 17000 La Rochelle')
      returning id
    `) as [{ id: string }];
    const [site] = (await sql`
      insert into sites_tenants
        (tenant_id, template, langues, seo_defaut, statut, publie_at)
      values
        (${tenant.id}, 'ocean', ${JSON.stringify(["fr", "en"])}::jsonb,
         ${JSON.stringify(seo)}::jsonb, 'publie', now())
      returning id
    `) as [{ id: string }];
    const [page] = (await sql`
      insert into pages_site
        (tenant_id, site_id, slug, type, template, statut, seo, langues, publie_at)
      values
        (${tenant.id}, ${site.id}, 'accueil', 'accueil', 'ocean', 'publie',
         ${JSON.stringify(seo)}::jsonb,
         ${JSON.stringify({ fr: "Bienvenue", en: "Welcome" })}::jsonb, now())
      returning id
    `) as [{ id: string }];
    await sql`
      insert into pages_site
        (tenant_id, site_id, slug, type, template, statut, seo, langues, publie_at)
      values
        (${tenant.id}, ${site.id}, 'contact', 'contact', 'ocean', 'publie',
         ${JSON.stringify(seo)}::jsonb,
         ${JSON.stringify({ fr: "Contact", en: "Contact" })}::jsonb, now())
    `;
    await sql`
      insert into sections_site (tenant_id, page_id, type, position, contenu, visible)
      values
        (${tenant.id}, ${page.id}, 'hero', 0,
         ${JSON.stringify({ titre: "Villa E2E", sousTitre: "Séjour de test" })}::jsonb, true),
        (${tenant.id}, ${page.id}, 'equipements', 1,
         ${JSON.stringify({ titre: "Équipements", items: ["Terrasse", "Wi-Fi"] })}::jsonb, true)
    `;
  });

  test.afterAll(async () => {
    if (!sql) return;
    await sql`delete from tenants where slug = ${SLUG}`;
    await sql.end();
  });

  test("rend le contenu, le SEO et le JSON-LD sans hydratation", async ({
    page,
  }) => {
    const reponse = await page.goto(`/site/${SLUG}`);
    expect(reponse?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: "Villa E2E" }),
    ).toBeVisible();
    await expect(page.getByText("Terrasse", { exact: true })).toBeVisible();

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", new RegExp(`/site/${SLUG}$`));

    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toHaveCount(1);
    const contenuJsonLd = await jsonLd.evaluate((element) => element.textContent);
    expect(contenuJsonLd).toContain('"@type":"LodgingBusiness"');

    await expect(
      page.locator('script[src*="_app/immutable/entry"]'),
    ).toHaveCount(0);
  });

  test("sert le sitemap et la version anglaise", async ({ page, request }) => {
    const sitemap = await request.get(`/site/${SLUG}/sitemap.xml`);
    expect(sitemap.status()).toBe(200);
    const xml = await sitemap.text();
    expect(xml).toContain(`/site/${SLUG}`);
    expect(xml).toContain(`/site/${SLUG}/contact`);

    await page.goto(`/site/${SLUG}?lang=en`);
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Contact", exact: true }),
    ).toBeVisible();
  });

  test("sert le widget embarquable", async ({ request }) => {
    const widget = await request.get(`/api/widget?tenant=${SLUG}`);
    expect(widget.status()).toBe(200);
    expect(widget.headers()["content-security-policy"]).toContain(
      "frame-ancestors *",
    );
    const html = await widget.text();
    expect(html).toContain("Réserver chez Démo E2E");
    expect(html).toContain("/reserver");

    const script = await request.get("/widget.js");
    expect(script.status()).toBe(200);
    expect(await script.text()).toContain("data-tenant");

    const inconnu = await request.get("/api/widget?tenant=inexistant");
    expect(inconnu.status()).toBe(404);
  });
});
