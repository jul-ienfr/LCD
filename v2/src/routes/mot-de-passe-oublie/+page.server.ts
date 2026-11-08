import { fail } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/server/auth";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import type { Actions } from "./$types";

export const actions = {
  default: async (event) => {
    const donnees = await event.request.formData();
    const email = String(donnees.get("email") ?? "").trim().toLowerCase();
    if (!email) return fail(400, { message: "Renseignez votre e-mail." });

    try {
      await auth.api.requestPasswordReset({
        body: {
          email,
          redirectTo: `${env.APP_URL.replace(/\/$/, "")}/reinitialiser-mot-de-passe`,
        },
        headers: event.request.headers,
      });
    } catch (error) {
      if (!(error instanceof APIError)) {
        logErreur("motdepasseoublie", error);
      }
    }

    return {
      ok: true,
      message:
        "Si un compte existe avec cette adresse, un e-mail de réinitialisation vient d’être envoyé (valable 1 heure).",
    };
  },
} satisfies Actions;
