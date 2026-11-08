import type {
  LanguePublique,
  SeoPage,
  SiteTenant,
  StatutSite,
  TemplateSite,
} from "@/domain/page-publique";

export interface CreerSiteTenant {
  tenantId: string;
  template: TemplateSite;
  langues: readonly LanguePublique[];
  seoDefaut: SeoPage;
  statut: StatutSite;
}

export interface MettreAJourSiteTenant {
  template?: TemplateSite;
  langues?: readonly LanguePublique[];
  seoDefaut?: SeoPage;
  statut?: StatutSite;
  publieAt?: Date | null;
}

export interface SitesTenantsRepository {
  trouverParTenant(tenantId: string): Promise<SiteTenant | null>;
  creer(data: CreerSiteTenant): Promise<SiteTenant>;
  mettreAJour(
    tenantId: string,
    data: MettreAJourSiteTenant,
  ): Promise<SiteTenant | null>;
}
