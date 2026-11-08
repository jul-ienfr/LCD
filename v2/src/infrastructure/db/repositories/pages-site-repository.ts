import { and, asc, eq } from "drizzle-orm";
import type {
  CreerPageSite,
  MettreAJourPageSite,
  PagesSiteRepository,
} from "@/application/ports/pages-site-repository";
import type {
  BlocSite,
  LanguePublique,
  PageSite,
  SeoPage,
  StatutSite,
  TemplateSite,
  TypeBlocSite,
  TypePageSite,
} from "@/domain/page-publique";
import { languePubliqueValide } from "@/domain/page-publique";
import { withTenant } from "../client";
import { pagesSite, sectionsSite } from "../schema";

function versSeo(valeur: SeoPage): SeoPage {
  return {
    title: typeof valeur.title === "string" ? valeur.title : "",
    description:
      typeof valeur.description === "string" ? valeur.description : "",
    ogImage: typeof valeur.ogImage === "string" ? valeur.ogImage : null,
  };
}

function versLangues(
  valeur: Record<string, string>,
): Partial<Record<LanguePublique, string>> {
  const langues: Partial<Record<LanguePublique, string>> = {};
  for (const [code, contenu] of Object.entries(valeur ?? {})) {
    if (languePubliqueValide(code) && typeof contenu === "string") {
      langues[code] = contenu;
    }
  }
  return langues;
}

function versPage(row: typeof pagesSite.$inferSelect): PageSite {
  return {
    id: row.id,
    tenantId: row.tenantId,
    siteId: row.siteId,
    slug: row.slug,
    type: row.type as TypePageSite,
    logementId: row.logementId,
    template: row.template as TemplateSite,
    statut: row.statut as StatutSite,
    seo: versSeo(row.seo),
    langues: versLangues(row.langues),
    publieAt: row.publieAt,
  };
}

function versBloc(row: typeof sectionsSite.$inferSelect): BlocSite {
  return {
    id: row.id,
    type: row.type as TypeBlocSite,
    position: row.position,
    visible: row.visible,
    contenu: row.contenu,
  };
}

export class DrizzlePagesSiteRepository implements PagesSiteRepository {
  async listerParSite(tenantId: string, siteId: string): Promise<PageSite[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(pagesSite)
        .where(
          and(eq(pagesSite.tenantId, tenantId), eq(pagesSite.siteId, siteId)),
        )
        .orderBy(asc(pagesSite.slug));
      return rows.map(versPage);
    });
  }

  async trouverParId(
    tenantId: string,
    pageId: string,
  ): Promise<PageSite | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(pagesSite)
        .where(
          and(eq(pagesSite.tenantId, tenantId), eq(pagesSite.id, pageId)),
        )
        .limit(1);
      return row ? versPage(row) : null;
    });
  }

  async trouverParSlug(
    tenantId: string,
    slug: string,
  ): Promise<PageSite | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(pagesSite)
        .where(
          and(eq(pagesSite.tenantId, tenantId), eq(pagesSite.slug, slug)),
        )
        .limit(1);
      return row ? versPage(row) : null;
    });
  }

  async creer(data: CreerPageSite): Promise<PageSite> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(pagesSite)
        .values({
          tenantId: data.tenantId,
          siteId: data.siteId,
          slug: data.slug,
          type: data.type,
          logementId: data.logementId,
          template: data.template,
          statut: data.statut,
          seo: data.seo,
          langues: data.langues,
        })
        .returning();
      if (!row) throw new Error("Création de la page impossible.");
      return versPage(row);
    });
  }

  async mettreAJour(
    tenantId: string,
    pageId: string,
    data: MettreAJourPageSite,
  ): Promise<PageSite | null> {
    const valeurs: Partial<typeof pagesSite.$inferInsert> = {};
    if (data.slug !== undefined) valeurs.slug = data.slug;
    if (data.type !== undefined) valeurs.type = data.type;
    if (data.logementId !== undefined) valeurs.logementId = data.logementId;
    if (data.template !== undefined) valeurs.template = data.template;
    if (data.statut !== undefined) valeurs.statut = data.statut;
    if (data.seo !== undefined) valeurs.seo = data.seo;
    if (data.langues !== undefined) valeurs.langues = data.langues;
    if (data.publieAt !== undefined) valeurs.publieAt = data.publieAt;
    if (Object.keys(valeurs).length === 0) {
      return this.trouverParId(tenantId, pageId);
    }

    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(pagesSite)
        .set(valeurs)
        .where(
          and(eq(pagesSite.tenantId, tenantId), eq(pagesSite.id, pageId)),
        )
        .returning();
      return row ? versPage(row) : null;
    });
  }

  async supprimer(tenantId: string, pageId: string): Promise<boolean> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .delete(pagesSite)
        .where(
          and(eq(pagesSite.tenantId, tenantId), eq(pagesSite.id, pageId)),
        )
        .returning({ id: pagesSite.id });
      return rows.length > 0;
    });
  }

  async remplacerBlocs(
    tenantId: string,
    pageId: string,
    blocs: readonly BlocSite[],
  ): Promise<void> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .delete(sectionsSite)
        .where(
          and(
            eq(sectionsSite.tenantId, tenantId),
            eq(sectionsSite.pageId, pageId),
          ),
        );
      if (blocs.length === 0) return;
      await tx.insert(sectionsSite).values(
        blocs.map((bloc) => ({
          tenantId,
          pageId,
          type: bloc.type,
          position: bloc.position,
          contenu: bloc.contenu,
          visible: bloc.visible,
        })),
      );
    });
  }

  async listerBlocs(tenantId: string, pageId: string): Promise<BlocSite[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(sectionsSite)
        .where(
          and(
            eq(sectionsSite.tenantId, tenantId),
            eq(sectionsSite.pageId, pageId),
          ),
        )
        .orderBy(asc(sectionsSite.position));
      return rows.map(versBloc);
    });
  }
}
