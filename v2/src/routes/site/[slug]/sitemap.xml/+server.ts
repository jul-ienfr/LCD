import { error } from "@sveltejs/kit";
import { DrizzlePagesSiteRepository } from "@/infrastructure/db/repositories/pages-site-repository";
import { DrizzleSitesTenantsRepository } from "@/infrastructure/db/repositories/sites-tenants-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, url }) => {
  const tenant = await new DrizzleTenantRepository().trouverParSlug(params.slug);
  if (!tenant) error(404, "Site introuvable.");

  const site = await new DrizzleSitesTenantsRepository().trouverParTenant(
    tenant.id,
  );
  if (!site || site.statut !== "publie") error(404, "Site non publié.");

  const pages = (await new DrizzlePagesSiteRepository().listerParSite(
    tenant.id,
    site.id,
  )).filter((page) => page.statut === "publie");

  const urls = pages.map((page) => {
    const chemin = page.slug === "accueil" ? "" : `/${page.slug}`;
    return `  <url><loc>${url.origin}/site/${tenant.slug}${chemin}</loc></url>`;
  });

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`,
    {
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    },
  );
};
