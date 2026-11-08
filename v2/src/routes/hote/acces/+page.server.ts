import { isRedirect, redirect } from "@sveltejs/kit";
import { RevoquerSession } from "@/application/use-cases/revoquer-session";
import { libelleDuree, minutesDepuis, sessionActive } from "@/domain/acces";
import { ErreurMetier } from "@/domain/erreurs";
import { libelleRole } from "@/domain/utilisateur";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleSessionsRepository } from "@/infrastructure/db/repositories/sessions-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { traductionsAcces } from "@/lib/i18n-acces";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function formaterDate(date: Date, langue: string): string {
  return new Intl.DateTimeFormat(langue === "fr" ? "fr-FR" : langue, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin"]);
  const tenantId = tenantIdDeSession(session);
  const repo = new DrizzleSessionsRepository();
  const langue = event.cookies.get("lcd_langue") ?? "fr";
  const t = traductionsAcces(langue);

  const [sessions, parUtilisateur, utilisateurs] = await Promise.all([
    repo.listerParTenant(tenantId, 50),
    repo.compterActivesParUtilisateur(tenantId),
    new DrizzleUserRepository().listerParTenant(tenantId),
  ]);

  return {
    t,
    sessions: sessions.map((ligne) => ({
      id: ligne.id,
      userName: ligne.userName,
      userEmail: ligne.userEmail,
      role: libelleRole(ligne.role),
      userAgent: ligne.userAgent,
      ip: ligne.ipAddress,
      activite: libelleDuree(minutesDepuis(ligne.updatedAt)),
      expire: formaterDate(ligne.expiresAt, langue),
      active: sessionActive(ligne.expiresAt),
      estSoi: ligne.userId === session.user.id,
    })),
    comptes: utilisateurs
      .filter((utilisateur) => utilisateur.actif)
      .map((utilisateur) => ({
        id: utilisateur.id,
        nom: utilisateur.name,
        role: libelleRole(utilisateur.role),
        sessions: parUtilisateur[utilisateur.id] ?? 0,
      })),
    kpis: {
      actives: Object.values(parUtilisateur).reduce((total, nombre) => total + nombre, 0),
      comptesActifs: utilisateurs.filter((utilisateur) => utilisateur.actif).length,
      admins: utilisateurs.filter((utilisateur) => utilisateur.actif && utilisateur.role === "admin").length,
      sansSession: utilisateurs.filter(
        (utilisateur) => utilisateur.actif && !(parUtilisateur[utilisateur.id] ?? 0),
      ).length,
    },
    ok: event.url.searchParams.get("ok"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  revoquer: async (event) => {
    const session = requireRole(event, ["admin"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = String(donnees.get("id") ?? "");

    try {
      const revoquee = await new RevoquerSession(
        new DrizzleSessionsRepository(),
      ).executer(session.user.id, tenantId, id);

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "acces.revoquer",
          cible: revoquee.userId,
          ref: revoquee.id,
          payload: { ipAddress: revoquee.ipAddress },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(303, `/hote/acces?erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("acces.revoquer", error, { tenantId, cible: id });
      redirect(303, "/hote/acces?erreur=inattendu");
    }

    redirect(303, "/hote/acces?ok=revoque");
  },
} satisfies Actions;
