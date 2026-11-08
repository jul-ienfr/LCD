import type {
  BlocSite,
  LanguePublique,
  PageSite,
  SeoPage,
  StatutSite,
  TemplateSite,
  TypePageSite,
} from "@/domain/page-publique";

export interface CreerPageSite {
  tenantId: string;
  siteId: string;
  slug: string;
  type: TypePageSite;
  logementId: string | null;
  template: TemplateSite;
  statut: StatutSite;
  seo: SeoPage;
  langues: Partial<Record<LanguePublique, string>>;
}

export interface MettreAJourPageSite {
  slug?: string;
  type?: TypePageSite;
  logementId?: string | null;
  template?: TemplateSite;
  statut?: StatutSite;
  seo?: SeoPage;
  langues?: Partial<Record<LanguePublique, string>>;
  publieAt?: Date | null;
}

export interface PagesSiteRepository {
  listerParSite(tenantId: string, siteId: string): Promise<PageSite[]>;
  trouverParId(tenantId: string, pageId: string): Promise<PageSite | null>;
  trouverParSlug(tenantId: string, slug: string): Promise<PageSite | null>;
  creer(data: CreerPageSite): Promise<PageSite>;
  mettreAJour(
    tenantId: string,
    pageId: string,
    data: MettreAJourPageSite,
  ): Promise<PageSite | null>;
  supprimer(tenantId: string, pageId: string): Promise<boolean>;
  /** Remplace tous les blocs d'une page, dans l'ordre fourni. */
  remplacerBlocs(
    tenantId: string,
    pageId: string,
    blocs: readonly BlocSite[],
  ): Promise<void>;
  listerBlocs(tenantId: string, pageId: string): Promise<BlocSite[]>;
}
