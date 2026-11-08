export const TEMPLATES_SITE = ["sejour", "ocean", "sable"] as const;
export type TemplateSite = (typeof TEMPLATES_SITE)[number];

export const TYPES_PAGE_SITE = [
  "accueil",
  "logement",
  "region",
  "contact",
] as const;
export type TypePageSite = (typeof TYPES_PAGE_SITE)[number];

export const TYPES_BLOC_SITE = [
  "hero",
  "galerie",
  "description",
  "equipements",
  "carte",
  "avis",
  "cta",
] as const;
export type TypeBlocSite = (typeof TYPES_BLOC_SITE)[number];

export const LANGUES_PUBLIQUES = [
  "fr",
  "en",
  "es",
  "it",
  "de",
  "nl",
] as const;
export type LanguePublique = (typeof LANGUES_PUBLIQUES)[number];

export const SLUGS_RESERVES = [
  "api",
  "admin",
  "hote",
  "supervision",
  "login",
  "logout",
  "inscription",
  "mot-de-passe-oublie",
  "preview",
  "legales",
  "voyageur",
  "sitemap.xml",
  "robots.txt",
] as const;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DOMAINE =
  /^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

export type StatutSite = "brouillon" | "publie";
export type StatutDomaine = "en_attente" | "verifie" | "actif" | "erreur";

export interface SeoPage {
  title: string;
  description: string;
  ogImage: string | null;
  utmSource?: string | null;
}

export interface BlocSite {
  id: string;
  type: TypeBlocSite;
  position: number;
  visible: boolean;
  contenu: Record<string, unknown>;
}

export interface PageSite {
  id: string;
  tenantId: string;
  siteId: string;
  slug: string;
  type: TypePageSite;
  logementId: string | null;
  template: TemplateSite;
  statut: StatutSite;
  seo: SeoPage;
  langues: Partial<Record<LanguePublique, string>>;
  publieAt: Date | null;
}

export interface SiteTenant {
  id: string;
  tenantId: string;
  template: TemplateSite;
  langues: readonly LanguePublique[];
  seoDefaut: SeoPage;
  statut: StatutSite;
  publieAt: Date | null;
}

export interface DomaineSite {
  id: string;
  tenantId: string;
  domaine: string;
  statut: StatutDomaine;
  verificationToken: string | null;
  certificatAt: Date | null;
  createdAt: Date;
}

export function templateSiteValide(valeur: string): valeur is TemplateSite {
  return (TEMPLATES_SITE as readonly string[]).includes(valeur);
}

export function typePageSiteValide(valeur: string): valeur is TypePageSite {
  return (TYPES_PAGE_SITE as readonly string[]).includes(valeur);
}

export function typeBlocSiteValide(valeur: string): valeur is TypeBlocSite {
  return (TYPES_BLOC_SITE as readonly string[]).includes(valeur);
}

export function languePubliqueValide(
  valeur: string,
): valeur is LanguePublique {
  return (LANGUES_PUBLIQUES as readonly string[]).includes(valeur);
}

export function slugPageValide(slug: string): boolean {
  return (
    slug.length >= 1 &&
    slug.length <= 80 &&
    SLUG.test(slug) &&
    !(SLUGS_RESERVES as readonly string[]).includes(slug)
  );
}

export function normaliserSlug(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function domaineValide(domaine: string): boolean {
  return DOMAINE.test(domaine);
}

export function normaliserDomaine(valeur: string): string {
  return valeur
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
}

export function languesPubliquesValides(
  langues: readonly string[],
): langues is readonly LanguePublique[] {
  if (langues.length === 0) return false;
  const uniques = new Set(langues);
  if (uniques.size !== langues.length) return false;
  return langues.every((langue) => languePubliqueValide(langue));
}

/**
 * Repli déterministe : langue demandée si disponible, sinon français, sinon
 * la première langue publiée. Le rendu ne doit jamais échouer faute de langue.
 */
export function choisirLangue(
  demandee: string,
  disponibles: readonly LanguePublique[],
): LanguePublique {
  if (languePubliqueValide(demandee) && disponibles.includes(demandee)) {
    return demandee;
  }
  if (disponibles.includes("fr")) return "fr";
  return disponibles[0] ?? "fr";
}

export function seoPageValide(seo: SeoPage): boolean {
  return (
    seo.title.trim().length >= 1 &&
    seo.title.trim().length <= 70 &&
    seo.description.trim().length >= 1 &&
    seo.description.trim().length <= 160 &&
    (seo.ogImage === null || /^https?:\/\//.test(seo.ogImage))
  );
}

export function blocSiteValide(bloc: BlocSite): boolean {
  return (
    typeBlocSiteValide(bloc.type) &&
    Number.isInteger(bloc.position) &&
    bloc.position >= 0 &&
    typeof bloc.contenu === "object" &&
    bloc.contenu !== null
  );
}

/**
 * Une page doit avoir un slug valide, un type valide, un template valide et au
 * moins une langue remplie. Une page `logement` doit référencer un logement.
 */
export function pageSiteValide(page: PageSite): boolean {
  return (
    slugPageValide(page.slug) &&
    typePageSiteValide(page.type) &&
    templateSiteValide(page.template) &&
    (page.type !== "logement" || page.logementId !== null) &&
    Object.values(page.langues).some(
      (contenu) => typeof contenu === "string" && contenu.trim().length > 0,
    ) &&
    seoPageValide(page.seo)
  );
}
