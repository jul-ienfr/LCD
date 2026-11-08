import type { PagesSiteRepository } from "@/application/ports/pages-site-repository";
import type { SitesTenantsRepository } from "@/application/ports/sites-tenants-repository";
import { ErreurMetier } from "@/domain/erreurs";
import {
  pageSiteValide,
  type PageSite,
  type SiteTenant,
} from "@/domain/page-publique";

export interface ResultatPublication {
  site: SiteTenant;
  pages: PageSite[];
  publieAt: Date;
}

/**
 * Publie un site après validation des pages. Le statut n'est jamais déduit du
 * client : toutes les pages du site sont relues côté serveur, puis publiées.
 */
export class PublierSite {
  constructor(
    private readonly sites: SitesTenantsRepository,
    private readonly pages: PagesSiteRepository,
  ) {}

  async executer(
    tenantId: string,
    maintenant: Date = new Date(),
  ): Promise<ResultatPublication> {
    const site = await this.sites.trouverParTenant(tenantId);
    if (!site) {
      throw new ErreurMetier(
        "SITE_INVALIDE",
        "Aucun site n'est configuré pour ce tenant.",
      );
    }

    const pages = await this.pages.listerParSite(tenantId, site.id);
    if (!pages.some((page) => page.type === "accueil")) {
      throw new ErreurMetier(
        "SITE_INVALIDE",
        "Le site doit contenir au moins une page d'accueil.",
      );
    }

    for (const page of pages) {
      if (!pageSiteValide(page)) {
        throw new ErreurMetier(
          "SITE_INVALIDE",
          `La page « ${page.slug} » est incomplète : slug, template, SEO, langue ou logement manquant.`,
        );
      }
    }

    const sitePublie = await this.sites.mettreAJour(tenantId, {
      statut: "publie",
      publieAt: maintenant,
    });
    if (!sitePublie) {
      throw new ErreurMetier(
        "SITE_INVALIDE",
        "La publication du site a échoué.",
      );
    }

    const pagesPubliees: PageSite[] = [];
    for (const page of pages) {
      const miseAJour = await this.pages.mettreAJour(tenantId, page.id, {
        statut: "publie",
        publieAt: maintenant,
      });
      if (miseAJour) pagesPubliees.push(miseAJour);
    }

    return { site: sitePublie, pages: pagesPubliees, publieAt: maintenant };
  }
}
