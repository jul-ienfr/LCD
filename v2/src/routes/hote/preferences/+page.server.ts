import { redirect } from "@sveltejs/kit";
import { traductionsPreferences } from "@/lib/i18n-preferences";
import { LANGUES } from "@/lib/i18n";
import { estLangue } from "@/lib/i18n-public";
import {
  COOKIE_DENSITE,
  COOKIE_MODE,
  COOKIE_NOTIFICATIONS,
  cookiesPreferences,
  estDensite,
  estModeApparence,
  preferencesDepuis,
} from "@/lib/preferences";
import { echecSaisie } from "@/lib/server/saisie";
import { requireSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

/**
 * Préférences utilisateur (FR-043, spec 006).
 *
 * La page lit les cookies de préférence et les rend dans le formulaire ; les
 * actions les valident avant de les réécrire. La langue passe par le même
 * cookie que le reste du site (`lcd_langue`), le mode, la densité et les
 * notifications par leurs propres cookies (voir `@/lib/preferences`).
 */

const UN_AN = 365 * 24 * 60 * 60;

function optionsCookie(secure: boolean) {
  return { path: "/", sameSite: "lax" as const, maxAge: UN_AN, httpOnly: true, secure };
}

export const load: PageServerLoad = async (event) => {
  const session = requireSession(event);
  const preferences = preferencesDepuis(event.cookies);
  return {
    t: traductionsPreferences(preferences.langue),
    preferences,
    langues: LANGUES,
    email: session.user.email,
    ok: event.url.searchParams.get("ok") === "1",
  };
};

export const actions: Actions = {
  enregistrer: async ({ request, cookies, url }) => {
    const donnees = await request.formData();
    const mode = String(donnees.get("mode") ?? "");
    const densite = String(donnees.get("densite") ?? "");
    const langue = String(donnees.get("langue") ?? "");
    const notifications = String(donnees.get("notifications") ?? "") === "1";
    const secure = url.protocol === "https:";

    if (!estModeApparence(mode)) return echecSaisie(donnees, "mode");
    if (!estDensite(densite)) return echecSaisie(donnees, "densite");
    if (!estLangue(langue)) return echecSaisie(donnees, "langue");

    for (const cookie of cookiesPreferences({ mode, densite, notifications })) {
      cookies.set(cookie.nom, cookie.valeur, optionsCookie(secure));
    }
    // La langue reste lisible par le reste du site : même cookie, mêmes
    // options que `/api/langue`, sans `httpOnly` pour ne rien changer.
    cookies.set("lcd_langue", langue, {
      path: "/",
      sameSite: "lax",
      maxAge: UN_AN,
      secure,
    });

    redirect(303, "/hote/preferences?ok=1");
  },

  defauts: async ({ cookies }) => {
    for (const nom of [COOKIE_MODE, COOKIE_DENSITE, COOKIE_NOTIFICATIONS]) {
      cookies.delete(nom, { path: "/" });
    }
    redirect(303, "/hote/preferences?ok=1");
  },
};
