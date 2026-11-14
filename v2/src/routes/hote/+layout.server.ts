import type { LayoutServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { libelleRole } from "@/domain/utilisateur";
import { apparencePourRequete } from "@/lib/server/apparence";
import { traductionsNavigation } from "@/lib/i18n-nav";
import { lireApercu } from "@/lib/server/apercu";
import { langueRequete } from "@/lib/server/langue";
import {
  destinationRole,
  estSuperAdmin,
  requireSession,
} from "@/lib/server/session";

/**
 * Rôles servis par l'espace `/hote`. Les autres rôles ont leur propre surface :
 * plutôt que de les laisser heurter un `requireRole` qui les renvoie vers
 * `/login?erreur=acces` alors qu'ils sont connectés, on les redirige vers leur
 * accueil naturel.
 */
const ROLES_ESPACE_HOTE = new Set([
  "super_admin",
  "admin",
  "hote",
  "operateur",
  "comptable",
]);

/**
 * Routes `/hote` ouvertes à **tout compte authentifié** : la redirection par
 * surface ne doit pas masquer les pages personnelles (`/hote/securite` est
 * gardé par `requireSession` et sert à activer la 2FA quel que soit le rôle).
 */
const CHEMINS_TOUS_ROLES = new Set(["/hote/securite"]);

export const load: LayoutServerLoad = async (event) => {
  const session = requireSession(event);
  const apercu = lireApercu(event, session);
  const roleCourant = apercu?.role ?? session.user.role ?? "";
  const chemin = event.url.pathname.replace(/\/+$/, "") || "/";
  if (
    roleCourant &&
    !ROLES_ESPACE_HOTE.has(roleCourant) &&
    !CHEMINS_TOUS_ROLES.has(chemin)
  ) {
    redirect(303, destinationRole(roleCourant));
  }
  const { apparence } = await apparencePourRequete(event);
  const langue = langueRequete(event);

  return {
    apparence,
    langue,
    tNav: traductionsNavigation(langue),
    chemin: event.url.pathname,
    /**
     * Flag temporaire de bascule (T070). `ERGONOMIE_NAV=ancienne` restaure la
     * navigation d'origine le temps de la recette (T071). À supprimer en T072.
     */
    navVersion:
      process.env.ERGONOMIE_NAV === "ancienne" ? "ancienne" : "nouvelle",
    apercu: apercu
      ? { role: apercu.role, libelle: libelleRole(apercu.role) }
      : null,
    superAdmin: estSuperAdmin(session) && !apercu,
    utilisateur: {
      nom: session.user.name,
      email: session.user.email,
      role: apercu?.role ?? session.user.role ?? "",
      tenantId: session.user.tenantId ?? "",
    },
  };
};
