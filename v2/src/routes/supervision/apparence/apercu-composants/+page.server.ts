import { redirect } from "@sveltejs/kit";
import { THEMES } from "@/domain/apparence/registre";
import type { Mode } from "@/domain/apparence/types";
import { requireSuperAdmin } from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

/**
 * T097 — Aperçu des composants critiques du thème actif.
 *
 * Réservé au super-admin comme le reste de `/supervision` : l'aperçu des
 * composants sert à valider un thème avant publication, il ne doit pas être
 * public.
 */
export const load: PageServerLoad = async (event) => {
  const session = requireSuperAdmin(event);
  const modeParam = event.url.searchParams.get("mode");
  const mode: Mode = modeParam === "sombre" ? "sombre" : "clair";
  const themeId = event.url.searchParams.get("themeId");
  const themeAffiche = THEMES.find((theme) => theme.id === themeId) ?? null;

  if (themeId && !themeAffiche) {
    // Un thème inconnu dans l'URL ne doit pas produire un aperçu trompeur.
    redirect(303, "/supervision/apparence/apercu-composants");
  }

  return {
    mode,
    themeAffiche: themeAffiche
      ? {
          id: themeAffiche.id,
          nom: themeAffiche.nom,
          clair: themeAffiche.clair,
          sombre: themeAffiche.sombre,
        }
      : null,
    role: session.user.role ?? null,
  };
};
