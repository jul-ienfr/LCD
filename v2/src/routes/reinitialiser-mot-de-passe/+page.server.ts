import { fail, isRedirect, redirect } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/server/auth";
import { logErreur } from "@/lib/logger";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ url }) => ({
  token: url.searchParams.get("token") ?? "",
});

export const actions = {
  default: async (event) => {
    const donnees = await event.request.formData();
    const token = String(donnees.get("token") ?? "");
    const motDePasse = String(donnees.get("password") ?? "");
    const confirmation = String(donnees.get("confirmation") ?? "");

    if (!token) return fail(400, { ok: false, message: "Lien invalide ou incomplet." });
    if (motDePasse.length < 12) {
      return fail(400, {
        ok: false,
        message: "Le mot de passe doit faire au moins 12 caractères.",
      });
    }
    if (motDePasse !== confirmation) {
      return fail(400, { ok: false, message: "La confirmation ne correspond pas." });
    }

    try {
      await auth.api.resetPassword({
        body: { newPassword: motDePasse, token },
        headers: event.request.headers,
      });
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof APIError) {
        return fail(400, {
          ok: false,
          message: "Lien expiré ou invalide. Demandez un nouvel e-mail.",
        });
      }
      logErreur("reinitialiserMotDePasse", error);
      return fail(500, { ok: false, message: "Réinitialisation impossible. Réessayez." });
    }

    redirect(303, "/login?reinitialise=1");
  },
} satisfies Actions;
