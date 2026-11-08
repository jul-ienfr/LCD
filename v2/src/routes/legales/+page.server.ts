import { mediateurDepuisEnv } from "@/domain/mediation";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { env } from "@/lib/env";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, parent }) => {
  const { apparence } = await parent();
  const slug = url.searchParams.get("tenant")?.trim() || "lcd";
  const tenant = await new DrizzleTenantRepository().trouverParSlug(slug);
  const editeur = tenant && tenant.statut === "actif" ? tenant : null;

  return {
    identite: apparence.identite,
    mediateur: mediateurDepuisEnv({
      nom: env.MEDIATEUR_NOM,
      url: env.MEDIATEUR_URL,
      adresse: env.MEDIATEUR_ADRESSE,
    }),
    editeur: editeur
      ? {
          nom: editeur.nom,
          nature: editeur.nature,
          regime: editeur.regime,
          tva: editeur.tva,
          siren: editeur.siren ?? null,
          adresse: editeur.adresse ?? null,
          mentionsLegales: editeur.mentionsLegales ?? null,
        }
      : null,
  };
};
