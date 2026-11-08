import { fail, isRedirect, redirect } from "@sveltejs/kit";
import QRCode from "qrcode";
import { FermerAutresSessions } from "@/application/use-cases/fermer-autres-sessions";
import { deuxFacteursRequis } from "@/domain/securite";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleSessionsRepository } from "@/infrastructure/db/repositories/sessions-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { auth } from "@/lib/server/auth";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import { requireSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function nomNavigateur(userAgent: string | null | undefined): string {
  if (!userAgent) return "Navigateur inconnu";
  if (/Edg\//.test(userAgent)) return "Microsoft Edge";
  if (/Firefox\//.test(userAgent)) return "Firefox";
  if (/Chrome\//.test(userAgent)) return "Chrome";
  if (/Safari\//.test(userAgent)) return "Safari";
  return userAgent.slice(0, 80);
}

const formateurDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

export const load: PageServerLoad = async (event) => {
  const session = requireSession(event);
  const depot = new DrizzleSessionsRepository();
  const affichees = await depot.listerActivesParUtilisateur(
    session.user.id,
    10,
    session.session.id,
  );
  const totalSessions = Math.max(
    affichees.length,
    await depot.compterSessionsActives(session.user.id),
  );

  const retour =
    session.user.role === "presta"
      ? "/presta"
      : session.user.role === "proprietaire"
        ? "/proprio"
        : session.user.role === "commercial"
          ? "/commercial"
          : "/hote";

  return {
    langue: event.cookies.get("lcd_langue") ?? "fr",
    email: session.user.email,
    role: session.user.role,
    twoFactorEnabled: Boolean(session.user.twoFactorEnabled),
    exigenceDeuxFacteurs: deuxFacteursRequis(
      session.user.role ?? "",
      Boolean(session.user.twoFactorEnabled),
      env.AUTH_2FA_REQUIRED,
    ),
    retour,
    deuxfacteurs: event.url.searchParams.get("deuxfacteurs"),
    sessions: affichees.map((element) => ({
      id: element.id,
      actuelle: element.id === session.session.id,
      navigateur: nomNavigateur(element.userAgent),
      createdAt: formateurDate.format(element.createdAt),
      expiresAt: formateurDate.format(element.expiresAt),
      ip: element.ipAddress ?? "IP inconnue",
    })),
    totalSessions,
    autresSessions: Math.max(0, totalSessions - 1),
    motdepasse: event.url.searchParams.get("motdepasse"),
    sessionsEtat: event.url.searchParams.get("sessions"),
  };
};

export const actions = {
  activer2fa: async (event) => {
    requireSession(event);
    const donnees = await event.request.formData();
    const password = String(donnees.get("password") ?? "");
    try {
      const resultat = await auth.api.enableTwoFactor({
        headers: event.request.headers,
        body: { password },
      });
      if (!("totpURI" in resultat)) {
        return fail(400, { ok: false, message: "Méthode 2FA non prise en charge." });
      }
      const qr = await QRCode.toDataURL(resultat.totpURI, {
        margin: 1,
        width: 240,
      });
      return {
        ok: true,
        etape: "verifier" as const,
        message: "Scannez le QR code puis saisissez le code à 6 chiffres.",
        totpURI: resultat.totpURI,
        backupCodes: resultat.backupCodes,
        qr,
      };
    } catch (error) {
      logErreur("securite.activer2fa", error);
      return fail(400, {
        ok: false,
        message: "Activation impossible : vérifiez votre mot de passe.",
      });
    }
  },

  verifier2fa: async (event) => {
    const session = requireSession(event);
    const donnees = await event.request.formData();
    try {
      await auth.api.verifyTOTP({
        headers: event.request.headers,
        body: { code: String(donnees.get("code") ?? "") },
      });
      await withTenant(session.user.tenantId ?? "", (tx) =>
        tx.insert(auditLogs).values({
          tenantId: session.user.tenantId ?? "",
          qui: session.user.email,
          action: "utilisateur.2fa.activer",
          cible: session.user.id,
          payload: {},
        }),
      );
      redirect(303, "/hote/securite?deuxfacteurs=actif");
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("securite.verifier2fa", error);
      return fail(400, {
        ok: false,
        message: "Code refusé. Vérifiez l’heure de votre téléphone.",
      });
    }
  },

  desactiver2fa: async (event) => {
    const session = requireSession(event);
    const donnees = await event.request.formData();
    try {
      await auth.api.disableTwoFactor({
        headers: event.request.headers,
        body: { password: String(donnees.get("password") ?? "") },
      });
      await withTenant(session.user.tenantId ?? "", (tx) =>
        tx.insert(auditLogs).values({
          tenantId: session.user.tenantId ?? "",
          qui: session.user.email,
          action: "utilisateur.2fa.desactiver",
          cible: session.user.id,
          payload: {},
        }),
      );
      return { ok: true, message: "2FA désactivée." };
    } catch (error) {
      logErreur("securite.desactiver2fa", error);
      return fail(400, {
        ok: false,
        message: "Désactivation impossible : mot de passe incorrect.",
      });
    }
  },

  motdepasse: async (event) => {
    const session = requireSession(event);
    const donnees = await event.request.formData();
    const actuel = String(donnees.get("motDePasseActuel") ?? "");
    const nouveau = String(donnees.get("nouveauMotDePasse") ?? "");
    const confirmation = String(donnees.get("confirmation") ?? "");
    if (!actuel) {
      return fail(400, { ok: false, message: "Le mot de passe actuel est requis." });
    }
    if (nouveau.length < 12) {
      return fail(400, {
        ok: false,
        message: "Le nouveau mot de passe doit faire au moins 12 caractères.",
      });
    }
    if (nouveau !== confirmation) {
      return fail(400, { ok: false, message: "La confirmation ne correspond pas." });
    }
    try {
      await auth.api.changePassword({
        headers: event.request.headers,
        body: {
          currentPassword: actuel,
          newPassword: nouveau,
          revokeOtherSessions: true,
        },
      });
      await withTenant(session.user.tenantId ?? "", (tx) =>
        tx.insert(auditLogs).values({
          tenantId: session.user.tenantId ?? "",
          qui: session.user.email,
          action: "utilisateur.motdepasse",
          cible: session.user.id,
          payload: { soi: true },
        }),
      );
      redirect(303, "/hote/securite?motdepasse=ok");
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("securite.motdepasse", error);
      return fail(400, {
        ok: false,
        message:
          "Mot de passe actuel incorrect, ou nouveau mot de passe refusé par la politique de sécurité.",
      });
    }
  },

  sessions: async (event) => {
    const session = requireSession(event);
    try {
      await new FermerAutresSessions(
        new DrizzleSessionsRepository(),
      ).executer(session.user.id, session.session.id);
      if (session.user.tenantId) {
        await withTenant(session.user.tenantId, (tx) =>
          tx.insert(auditLogs).values({
            tenantId: session.user.tenantId,
            qui: session.user.email,
            action: "utilisateur.sessions",
            cible: session.user.id,
            ref: "autres",
            payload: {},
          }),
        );
      }
    } catch (error) {
      logErreur("securite.sessions", error, { userId: session.user.id });
      redirect(303, "/hote/securite?sessions=erreur");
    }
    redirect(303, "/hote/securite?sessions=ok");
  },
} satisfies Actions;
