"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { logErreur } from "@/lib/logger";
import { requireRole } from "@/lib/session";

export type EtatMotDePasse = { ok: boolean; message: string };

export async function changerMotDePasseAction(
  _etat: EtatMotDePasse,
  formData: FormData,
): Promise<EtatMotDePasse> {
  await requireRole(["admin", "hote", "presta", "proprietaire", "commercial"]);

  const actuel = String(formData.get("motDePasseActuel") ?? "");
  const nouveau = String(formData.get("nouveauMotDePasse") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (!actuel) {
    return { ok: false, message: "Le mot de passe actuel est requis." };
  }
  if (nouveau.length < 12) {
    return {
      ok: false,
      message: "Le nouveau mot de passe doit faire au moins 12 caractères.",
    };
  }
  if (nouveau !== confirmation) {
    return { ok: false, message: "La confirmation ne correspond pas." };
  }

  try {
    await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword: actuel,
        newPassword: nouveau,
        revokeOtherSessions: true,
      },
    });
  } catch (error) {
    logErreur("changerMotDePasseAction", error);
    return {
      ok: false,
      message:
        "Mot de passe actuel incorrect, ou nouveau mot de passe refusé par la politique de sécurité.",
    };
  }

  redirect("/hote/securite?motdepasse=ok");
}
