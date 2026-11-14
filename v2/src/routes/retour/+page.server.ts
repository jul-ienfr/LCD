import { fail, redirect } from "@sveltejs/kit";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { typeSuiviPour } from "@/lib/mesure/evenements";
import {
  estParcoursRetour,
  metadonneesRetour,
  validerRetour,
} from "@/lib/mesure/retour";
import { logErreur } from "@/lib/logger";
import {
  enregistrerEvenementSuivi,
  lireConsentementRequete,
  suiviActifPourTenant,
} from "@/lib/server/suivi";
import type { Actions, PageServerLoad } from "./$types";

const SLUG_DEFAUT = "lcd";

export const load: PageServerLoad = async ({ url }) => {
  const parcours = url.searchParams.get("parcours")?.trim() ?? "";
  return {
    parcours: estParcoursRetour(parcours) ? parcours : "",
    merci: url.searchParams.get("merci") === "1",
    tenant: url.searchParams.get("tenant")?.trim() || SLUG_DEFAUT,
    valeurs: { note: "", obstacles: [] as string[], support: "" },
    erreurs: {} as Record<string, string>,
  };
};

export const actions: Actions = {
  defaut: async (event) => {
    const donnees = await event.request.formData();
    const obstacles = donnees
      .getAll("obstacles")
      .map((valeur) => String(valeur));
    const brutes = {
      parcours: donnees.get("parcours"),
      note: donnees.get("note"),
      obstacles,
      support: donnees.get("support"),
    };
    const resultat = validerRetour(brutes);

    if (!resultat.ok) {
      return fail(400, {
        valeurs: {
          note: String(brutes.note ?? ""),
          obstacles,
          support: String(brutes.support ?? ""),
        },
        erreurs: resultat.erreurs,
      });
    }

    const tenant = await new DrizzleTenantRepository().trouverParSlug(
      String(donnees.get("tenant") ?? "").trim() || SLUG_DEFAUT,
    );
    const consentement = lireConsentementRequete(event);

    if (tenant && consentement?.mesure) {
      try {
        if (await suiviActifPourTenant(tenant.id)) {
          await enregistrerEvenementSuivi(
            event,
            tenant.id,
            consentement,
            {
              type: typeSuiviPour("retour_utilisateur"),
              nom: "retour_utilisateur",
              page: "/retour",
              metadata: metadonneesRetour(resultat.valeur),
            },
            { consentementRequis: "mesure" },
          );
        }
      } catch (error) {
        // Un échec de mesure ne doit jamais empêcher le retour d'être pris en
        // compte du point de vue de la personne qui l'envoie.
        logErreur("retour.mesure", error, { tenantId: tenant.id });
      }
    }

    redirect(303, `/retour?merci=1&parcours=${resultat.valeur.parcours}`);
  },
};
