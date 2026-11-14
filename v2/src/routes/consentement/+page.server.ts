import { redirect } from "@sveltejs/kit";
import {
  consentementAvec,
  consentementRefuse,
  consentementTout,
} from "@/domain/suivi";
import {
  lireConsentementRequete,
  poserConsentement,
} from "@/lib/server/suivi";
import type { Actions, PageServerLoad } from "./$types";

function retourValide(valeur: FormDataEntryValue | null): string {
  if (typeof valeur !== "string") return "/";
  return valeur.startsWith("/") && !valeur.startsWith("//") ? valeur : "/";
}

export const load: PageServerLoad = ({ cookies }) => ({
  consentement: lireConsentementRequete({ cookies }),
});

export const actions: Actions = {
  tout: async ({ cookies, url, request }) => {
    const donnees = await request.formData();
    poserConsentement({ cookies, url }, consentementTout());
    redirect(303, retourValide(donnees.get("retour")));
  },
  refus: async ({ cookies, url, request }) => {
    const donnees = await request.formData();
    poserConsentement({ cookies, url }, consentementRefuse());
    redirect(303, retourValide(donnees.get("retour")));
  },
  enregistrer: async ({ cookies, url, request }) => {
    const donnees = await request.formData();
    const mesure = donnees.get("mesure") === "1";
    const publicite = mesure && donnees.get("publicite") === "1";
    poserConsentement({ cookies, url }, consentementAvec(mesure, publicite));
    redirect(303, retourValide(donnees.get("retour")));
  },
};
