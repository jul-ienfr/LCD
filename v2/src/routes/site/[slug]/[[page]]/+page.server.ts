import { createHash } from "node:crypto";
import { error, fail } from "@sveltejs/kit";
import { CreerDemandeSejour } from "@/application/use-cases/creer-demande-sejour";
import { normaliserAttribution } from "@/domain/attribution";
import { ErreurMetier } from "@/domain/erreurs";
import { DrizzleDemandeSejourRepository } from "@/infrastructure/db/repositories/demande-sejour-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePagesSiteRepository } from "@/infrastructure/db/repositories/pages-site-repository";
import { DrizzleSitesTenantsRepository } from "@/infrastructure/db/repositories/sites-tenants-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { choisirLangue } from "@/domain/page-publique";
import { env } from "@/lib/env";
import { templateDefinition } from "@/lib/site/templates";
import type { Actions, PageServerLoad } from "./$types";

/**
 * Référence stable d'une demande publique : un rejeu du même formulaire
 * (double clic, retour arrière) retombe sur la même référence.
 */
function referenceDemande(parties: (string | null)[]): string {
  const empreinte = createHash("sha256")
    .update(parties.map((partie) => partie ?? "").join("|"))
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
  return `WEB-${empreinte}`;
}

export const load: PageServerLoad = async (event) => {
  const tenant = await new DrizzleTenantRepository().trouverParSlug(
    event.params.slug,
  );
  if (!tenant) error(404, "Site introuvable.");

  const site = await new DrizzleSitesTenantsRepository().trouverParTenant(
    tenant.id,
  );
  if (!site || site.statut !== "publie") error(404, "Site non publié.");

  const pagesRepo = new DrizzlePagesSiteRepository();
  const slugPage = event.params.page ?? "accueil";
  const page = await pagesRepo.trouverParSlug(tenant.id, slugPage);
  if (!page || page.statut !== "publie") error(404, "Page introuvable.");

  const blocs = await pagesRepo.listerBlocs(tenant.id, page.id);
  const pages = (await pagesRepo.listerParSite(tenant.id, site.id)).filter(
    (entree) => entree.statut === "publie",
  );
  const langue = choisirLangue(
    event.url.searchParams.get("lang") ??
      event.cookies.get("lcd_langue") ??
      "fr",
    site.langues,
  );
  const template = templateDefinition(site.template);
  const canonical = new URL(event.url.pathname, event.url.origin).toString();

  return {
    tenant: {
      nom: tenant.nom,
      slug: tenant.slug,
      adresse: tenant.adresse,
      mentionsLegales: tenant.mentionsLegales,
    },
    site,
    page,
    pages,
    blocs: blocs.filter((bloc) => bloc.visible),
    langue,
    template,
    canonical,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "LodgingBusiness",
      name: tenant.nom,
      url: canonical,
      ...(tenant.adresse ? { address: tenant.adresse } : {}),
      ...(page.seo.ogImage ? { image: page.seo.ogImage } : {}),
    },
    enquete: {
      active: env.ENQUIRY_ENABLED,
      source: normaliserAttribution({
        utmSource: event.url.searchParams.get("utm_source"),
        utmMedium: event.url.searchParams.get("utm_medium"),
        utmCampaign: event.url.searchParams.get("utm_campaign"),
      }),
      logements: (
        await new DrizzleLogementRepository().listerParTenant(tenant.id)
      )
        .filter((logement) => logement.statut === "actif")
        .map((logement) => ({ id: logement.id, nom: logement.nom })),
    },
  };
};

/**
 * Demande de séjour (enquiry) : réservée au site public activé par le flag.
 * La référence est stable, dérivée du contenu : un rejeu du formulaire ne
 * crée pas de doublon.
 */
export const actions: Actions = {
  demande: async (event) => {
    if (!env.ENQUIRY_ENABLED) {
      return fail(404, { erreur: "demande_indisponible" });
    }
    const tenant = await new DrizzleTenantRepository().trouverParSlug(
      event.params.slug,
    );
    if (!tenant) return fail(404, { erreur: "demande_indisponible" });

    const donnees = await event.request.formData();
    const texte = (champ: string): string =>
      String(donnees.get(champ) ?? "").trim();
    const arrivee = texte("arrivee") || null;
    const depart = texte("depart") || null;
    const logementId = texte("logementId") || null;
    const voyageurs = Number.parseInt(texte("voyageurs") || "1", 10);

    try {
      const { demande, dejaEnregistree } = await new CreerDemandeSejour(
        new DrizzleDemandeSejourRepository(),
      ).executer({
        tenantId: tenant.id,
        ref: referenceDemande([
          tenant.slug,
          texte("email"),
          texte("nom"),
          arrivee,
          depart,
          texte("message"),
        ]),
        nom: texte("nom"),
        email: texte("email"),
        telephone: texte("telephone") || null,
        arrivee,
        depart,
        voyageurs: Number.isNaN(voyageurs) ? 1 : voyageurs,
        message: texte("message") || null,
        logementId,
        source: texte("source") || "site",
      });
      return {
        ok: true,
        dejaEnregistree,
        ref: demande.ref,
      };
    } catch (error) {
      if (error instanceof ErreurMetier) {
        return fail(400, { erreur: error.message });
      }
      throw error;
    }
  },
};
