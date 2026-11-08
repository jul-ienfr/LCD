import { fail, isRedirect, redirect } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/server/auth";
import { logErreur } from "@/lib/logger";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ locals }) => {
  if (locals.session?.user.twoFactorEnabled === false) redirect(303, "/login");
  return {};
};

export const actions = {
  default: async (event) => {
    const donnees = await event.request.formData();
    const code = String(donnees.get("code") ?? "").replace(/\s/gu, "");
    if (!/^\d{6}$/u.test(code)) {
      return fail(400, { message: "Saisissez le code à 6 chiffres de votre application." });
    }
    try {
      await auth.api.verifyTOTP({
        body: { code },
        headers: event.request.headers,
      });
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof APIError) {
        return fail(400, {
          message:
            error.status === "TOO_MANY_REQUESTS"
              ? "Trop de tentatives. Patientez une minute."
              : "Code refusé. Vérifiez l’heure de votre téléphone.",
        });
      }
      logErreur("twofactor.verify", error);
      return fail(500, { message: "Vérification impossible. Réessayez." });
    }
    redirect(303, "/hote");
  },
} satisfies Actions;
