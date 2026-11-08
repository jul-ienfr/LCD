import { eq } from "drizzle-orm";
import type {
  CreerSiteTenant,
  MettreAJourSiteTenant,
  SitesTenantsRepository,
} from "@/application/ports/sites-tenants-repository";
import type {
  LanguePublique,
  SeoPage,
  SiteTenant,
  StatutSite,
  TemplateSite,
} from "@/domain/page-publique";
import { languePubliqueValide } from "@/domain/page-publique";
import { withTenant } from "../client";
import { sitesTenants } from "../schema";

function versSeo(valeur: SeoPage): SeoPage {
  return {
    title: typeof valeur.title === "string" ? valeur.title : "",
    description:
      typeof valeur.description === "string" ? valeur.description : "",
    ogImage: typeof valeur.ogImage === "string" ? valeur.ogImage : null,
  };
}

function versDomaine(row: typeof sitesTenants.$inferSelect): SiteTenant {
  return {
    id: row.id,
    tenantId: row.tenantId,
    template: row.template as TemplateSite,
    langues: (row.langues ?? []).filter(languePubliqueValide),
    seoDefaut: versSeo(row.seoDefaut),
    statut: row.statut as StatutSite,
    publieAt: row.publieAt,
  };
}

export class DrizzleSitesTenantsRepository implements SitesTenantsRepository {
  async trouverParTenant(tenantId: string): Promise<SiteTenant | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(sitesTenants)
        .where(eq(sitesTenants.tenantId, tenantId))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async creer(data: CreerSiteTenant): Promise<SiteTenant> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(sitesTenants)
        .values({
          tenantId: data.tenantId,
          template: data.template,
          langues: [...data.langues],
          seoDefaut: data.seoDefaut,
          statut: data.statut,
        })
        .returning();
      if (!row) throw new Error("Création du site impossible.");
      return versDomaine(row);
    });
  }

  async mettreAJour(
    tenantId: string,
    data: MettreAJourSiteTenant,
  ): Promise<SiteTenant | null> {
    const valeurs: Partial<typeof sitesTenants.$inferInsert> = {};
    if (data.template !== undefined) valeurs.template = data.template;
    if (data.langues !== undefined) valeurs.langues = [...data.langues];
    if (data.seoDefaut !== undefined) valeurs.seoDefaut = data.seoDefaut;
    if (data.statut !== undefined) valeurs.statut = data.statut;
    if (data.publieAt !== undefined) valeurs.publieAt = data.publieAt;
    if (Object.keys(valeurs).length === 0) {
      return this.trouverParTenant(tenantId);
    }

    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(sitesTenants)
        .set(valeurs)
        .where(eq(sitesTenants.tenantId, tenantId))
        .returning();
      return row ? versDomaine(row) : null;
    });
  }
}
