import { redirect } from "@sveltejs/kit";
import { consentementRefuse } from "@/domain/suivi";
import { poserConsentement } from "@/lib/server/suivi";
import type { RequestHandler } from "./$types";

/**
 * Ancien lien « J'ai compris » : il ne vaut pas consentement aux traceurs.
 * On enregistre donc un refus explicite, que l'utilisateur peut modifier sur
 * /consentement.
 */
export const GET: RequestHandler = ({ cookies, url }) => {
  poserConsentement({ cookies, url }, consentementRefuse());
  const retour = url.searchParams.get("retour") ?? "/";
  const cible = retour.startsWith("/") && !retour.startsWith("//") ? retour : "/";
  redirect(303, cible);
};
