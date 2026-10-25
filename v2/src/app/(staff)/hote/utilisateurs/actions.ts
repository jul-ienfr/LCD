"use server";

import { revalidatePath } from "next/cache";
import { ErreurMetier } from "@/domain/erreurs";
import { ChangerActifUtilisateur } from "@/application/use-cases/changer-actif-utilisateur";
import { CreerUtilisateur } from "@/application/use-cases/creer-utilisateur";
import { ReinitialiserMotDePasse } from "@/application/use-cases/reinitialiser-mot-de-passe";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export type EtatUtilisateur = { ok: boolean; message: string };

const ERREUR_INATTENDUE = "Erreur inattendue. Réessayez.";

function emailDejaUtilise(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export async function creerUtilisateurAction(
  _etat: EtatUtilisateur,
  formData: FormData,
): Promise<EtatUtilisateur> {
  const session = await requireRole(["admin"]);
  const tenantId = tenantIdDeSession(session);

  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const role = String(formData.get("role") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    const utilisateur = await new CreerUtilisateur(
      new DrizzleUserRepository(),
    ).executer({ tenantId, name, email, role, password });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "utilisateur.creer",
        cible: utilisateur.id,
        payload: { role: utilisateur.role },
      }),
    );

    revalidatePath("/hote/utilisateurs");
    return {
      ok: true,
      message: `Compte créé pour ${utilisateur.email}.`,
    };
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    if (emailDejaUtilise(error)) {
      return {
        ok: false,
        message: "Un compte utilise déjà cette adresse email.",
      };
    }
    logErreur("creerUtilisateurAction", error, { tenantId });
    return { ok: false, message: ERREUR_INATTENDUE };
  }
}

export async function changerActifUtilisateurAction(
  _etat: EtatUtilisateur,
  formData: FormData,
): Promise<EtatUtilisateur> {
  const session = await requireRole(["admin"]);
  const tenantId = tenantIdDeSession(session);
  const id = String(formData.get("userId") ?? "");
  const actif = String(formData.get("actif") ?? "") === "true";

  try {
    const utilisateur = await new ChangerActifUtilisateur(
      new DrizzleUserRepository(),
    ).executer({
      tenantId,
      id,
      actif,
      acteurId: session.user.id,
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: actif ? "utilisateur.activer" : "utilisateur.desactiver",
        cible: utilisateur.id,
        payload: { role: utilisateur.role },
      }),
    );

    revalidatePath("/hote/utilisateurs");
    return {
      ok: true,
      message: actif
        ? `Compte de ${utilisateur.email} réactivé.`
        : `Compte de ${utilisateur.email} désactivé. Ses sessions sont fermées.`,
    };
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    logErreur("changerActifUtilisateurAction", error, { tenantId, id });
    return { ok: false, message: ERREUR_INATTENDUE };
  }
}

export async function reinitialiserMotDePasseAction(
  _etat: EtatUtilisateur,
  formData: FormData,
): Promise<EtatUtilisateur> {
  const session = await requireRole(["admin"]);
  const tenantId = tenantIdDeSession(session);
  const id = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (password !== confirmation) {
    return {
      ok: false,
      message: "Les deux mots de passe ne correspondent pas.",
    };
  }

  if (id === session.user.id) {
    return {
      ok: false,
      message:
        "Pour votre propre compte, utilisez la page Sécurité / 2FA afin de conserver votre session.",
    };
  }

  try {
    const utilisateur = await new ReinitialiserMotDePasse(
      new DrizzleUserRepository(),
    ).executer({ tenantId, id, password });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "utilisateur.motdepasse",
        cible: utilisateur.id,
        payload: { role: utilisateur.role },
      }),
    );

    revalidatePath("/hote/utilisateurs");
    return {
      ok: true,
      message: `Mot de passe réinitialisé pour ${utilisateur.email}. Ses sessions ont été fermées.`,
    };
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    logErreur("reinitialiserMotDePasseAction", error, { tenantId, id });
    return { ok: false, message: ERREUR_INATTENDUE };
  }
}
