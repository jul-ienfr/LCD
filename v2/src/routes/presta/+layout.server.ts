import type { LayoutServerLoad } from "./$types";
import { langueRequete } from "@/lib/server/langue";
import { requireRole } from "@/lib/server/session";

/**
 * Layout de l'espace prestataire (FR-038, spec 006).
 *
 * L'espace prestataire n'avait ni menu ni langue : son seul écran était une
 * page isolée, sans en-tête ni sélecteur, et le français y était écrit en dur.
 * Ce layout porte désormais la garde de l'espace (mêmes rôles que la page :
 * prestataire, administrateur, hôte) et la langue demandée, que le layout
 * client et la page lisent pour rendre leur contenu.
 */
export const load: LayoutServerLoad = async (event) => {
  const session = requireRole(event, ["presta", "admin", "hote"]);

  return {
    langue: langueRequete(event),
    chemin: event.url.pathname,
    estPresta: session.user.role === "presta",
  };
};
