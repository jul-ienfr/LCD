import { describe, expect, it } from "vitest";
import { ErreurMetier } from "@/domain/erreurs";
import type {
  PageSite,
  SeoPage,
  SiteTenant,
} from "@/domain/page-publique";
import type { PagesSiteRepository } from "@/application/ports/pages-site-repository";
import type { SitesTenantsRepository } from "@/application/ports/sites-tenants-repository";
import { PublierSite } from "@/application/use-cases/publier-site";

const SEO: SeoPage = {
  title: "Villa Océan — La Rochelle",
  description: "Une villa lumineuse face à l'océan, idéale pour six personnes.",
  ogImage: null,
};

function site(overrides: Partial<SiteTenant> = {}): SiteTenant {
  return {
    id: "site-1",
    tenantId: "tenant-1",
    template: "ocean",
    langues: ["fr"],
    seoDefaut: SEO,
    statut: "brouillon",
    publieAt: null,
    ...overrides,
  };
}

function page(overrides: Partial<PageSite> = {}): PageSite {
  return {
    id: "page-1",
    tenantId: "tenant-1",
    siteId: "site-1",
    slug: "accueil",
    type: "accueil",
    logementId: null,
    template: "ocean",
    statut: "brouillon",
    seo: SEO,
    langues: { fr: "Bienvenue" },
    publieAt: null,
    ...overrides,
  };
}

function sitesRepo(initial: SiteTenant | null): SitesTenantsRepository {
  let courant = initial;
  return {
    trouverParTenant: async () => courant,
    creer: async () => {
      throw new Error("non utilisé");
    },
    mettreAJour: async (_tenantId, data) => {
      if (!courant) return null;
      courant = {
        ...courant,
        ...(data.template !== undefined ? { template: data.template } : {}),
        ...(data.langues !== undefined ? { langues: data.langues } : {}),
        ...(data.seoDefaut !== undefined ? { seoDefaut: data.seoDefaut } : {}),
        ...(data.statut !== undefined ? { statut: data.statut } : {}),
        ...(data.publieAt !== undefined ? { publieAt: data.publieAt } : {}),
      };
      return courant;
    },
  };
}

function pagesRepo(initial: PageSite[]): PagesSiteRepository {
  let courant = [...initial];
  return {
    listerParSite: async () => courant,
    trouverParId: async (_tenantId, pageId) =>
      courant.find((entree) => entree.id === pageId) ?? null,
    trouverParSlug: async (_tenantId, slug) =>
      courant.find((entree) => entree.slug === slug) ?? null,
    creer: async () => {
      throw new Error("non utilisé");
    },
    mettreAJour: async (_tenantId, pageId, data) => {
      const index = courant.findIndex((entree) => entree.id === pageId);
      if (index < 0) return null;
      const actuelle = courant[index]!;
      courant[index] = {
        ...actuelle,
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.logementId !== undefined
          ? { logementId: data.logementId }
          : {}),
        ...(data.template !== undefined ? { template: data.template } : {}),
        ...(data.statut !== undefined ? { statut: data.statut } : {}),
        ...(data.seo !== undefined ? { seo: data.seo } : {}),
        ...(data.langues !== undefined ? { langues: data.langues } : {}),
        ...(data.publieAt !== undefined ? { publieAt: data.publieAt } : {}),
      };
      return courant[index]!;
    },
    supprimer: async () => false,
    remplacerBlocs: async () => {},
    listerBlocs: async () => [],
  };
}

describe("PublierSite", () => {
  it("publie le site et toutes ses pages", async () => {
    const siteInitial = site();
    const pages = [page(), page({ id: "page-2", slug: "contact", type: "contact" })];
    const useCase = new PublierSite(sitesRepo(siteInitial), pagesRepo(pages));

    const resultat = await useCase.executer("tenant-1", new Date("2026-11-06T10:00:00Z"));

    expect(resultat.site.statut).toBe("publie");
    expect(resultat.pages).toHaveLength(2);
    expect(resultat.pages.every((entree) => entree.statut === "publie")).toBe(true);
    expect(resultat.publieAt.toISOString()).toBe("2026-11-06T10:00:00.000Z");
  });

  it("refuse un tenant sans site", async () => {
    const useCase = new PublierSite(sitesRepo(null), pagesRepo([]));
    await expect(useCase.executer("tenant-1")).rejects.toBeInstanceOf(ErreurMetier);
  });

  it("refuse un site sans page", async () => {
    const useCase = new PublierSite(sitesRepo(site()), pagesRepo([]));
    await expect(useCase.executer("tenant-1")).rejects.toThrow(
      "au moins une page d'accueil",
    );
  });

  it("refuse un site sans page d'accueil", async () => {
    const useCase = new PublierSite(
      sitesRepo(site()),
      pagesRepo([page({ type: "contact", slug: "contact" })]),
    );
    await expect(useCase.executer("tenant-1")).rejects.toThrow(
      "au moins une page d'accueil",
    );
  });

  it("refuse une page logement sans logement", async () => {
    const useCase = new PublierSite(
      sitesRepo(site()),
      pagesRepo([
        page(),
        page({ id: "page-2", slug: "villa", type: "logement", logementId: null }),
      ]),
    );
    await expect(useCase.executer("tenant-1")).rejects.toThrow("villa");
  });
});
