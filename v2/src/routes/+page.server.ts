import { logementPubliable } from "@/domain/logement";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleTarifRepository } from "@/infrastructure/db/repositories/tarif-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { logErreur } from "@/lib/logger";
import { photoLogement } from "@/lib/photos-logement";
import type { PageServerLoad } from "./$types";

const euros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export const load: PageServerLoad = async ({ parent }) => {
  const data = await parent();
  try {
    const tenant = await new DrizzleTenantRepository().trouverParSlug("lcd");
    if (!tenant) return { ...data, adresses: [] };

    const publies = (
      await new DrizzleLogementRepository().listerParTenant(tenant.id)
    ).filter(logementPubliable);

    const codesDemo = new Set([
      "villa-santa-severa",
      "mas-des-oliviers",
      "loft-du-port",
    ]);
    const vedettes = publies.filter((logement) => codesDemo.has(logement.code));
    const logements = (vedettes.length > 0 ? vedettes : publies).slice(0, 3);

    const debut = new Date();
    const fin = new Date(debut);
    fin.setUTCDate(fin.getUTCDate() + 60);
    const debutIso = debut.toISOString().slice(0, 10);
    const finIso = fin.toISOString().slice(0, 10);
    const tarifs = new DrizzleTarifRepository();

    const adresses = await Promise.all(
      logements.map(async (logement, index) => {
        const prix = (
          await tarifs.listerParMois(tenant.id, logement.id, debutIso, finIso)
        )
          .map((tarif) => tarif.prixCentimes)
          .filter((centimes) => Number.isInteger(centimes) && centimes > 0);

        return {
          id: logement.id,
          nom: logement.nom,
          adresse: logement.adresse,
          photo: photoLogement(logement.code, index),
          prix: prix.length > 0 ? euros.format(Math.min(...prix) / 100) : null,
        };
      }),
    );

    return { ...data, adresses };
  } catch (error) {
    logErreur("page.accueil.adresses", error);
    return { ...data, adresses: [] };
  }
};
