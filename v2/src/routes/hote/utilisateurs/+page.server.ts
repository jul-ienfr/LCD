import { fail, isRedirect, redirect } from "@sveltejs/kit";
import { ChangerActifUtilisateur } from "@/application/use-cases/changer-actif-utilisateur";
import { ChangerRoleUtilisateur } from "@/application/use-cases/changer-role-utilisateur";
import { CreerUtilisateur } from "@/application/use-cases/creer-utilisateur";
import { ReinitialiserDeuxFacteurs } from "@/application/use-cases/reinitialiser-deux-facteurs";
import { ReinitialiserMotDePasse } from "@/application/use-cases/reinitialiser-mot-de-passe";
import { ErreurMetier } from "@/domain/erreurs";
import {
  LIBELLES_ROLE,
  ROLES_UTILISATEUR,
  assuranceRcValide,
  joursAvantExpirationRc,
  libelleRole,
} from "@/domain/utilisateur";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { traductionsAdministration } from "@/lib/i18n-administration";
import { logErreur } from "@/lib/logger";
import {
  estSuperAdmin,
  requireRole,
  tenantIdDeSession,
} from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

function roleActeur(session: {
  user: { role?: string | null; email?: string | null };
}): string {
  return estSuperAdmin(session) ? "super_admin" : (session.user.role ?? "");
}

function emailDejaUtilise(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin"]);
  const tenantId = tenantIdDeSession(session);
  const utilisateurs = await new DrizzleUserRepository().listerParTenant(
    tenantId,
  );
  const tries = [...utilisateurs].sort((a, b) => {
    const soiA = a.id === session.user.id ? 0 : 1;
    const soiB = b.id === session.user.id ? 0 : 1;
    return soiA - soiB || a.name.localeCompare(b.name);
  });
  const aujourdHui = new Date().toISOString().slice(0, 10);

  return {
    t: traductionsAdministration(event.cookies.get("lcd_langue") ?? "fr"),
    utilisateurs: tries.map((utilisateur) => ({
      id: utilisateur.id,
      name: utilisateur.name,
      email: utilisateur.email,
      role: utilisateur.role,
      roleLibelle: libelleRole(utilisateur.role),
      actif: utilisateur.actif,
      twoFactorEnabled: Boolean(utilisateur.deuxFacteurs),
      soi: utilisateur.id === session.user.id,
      rcExpireLe: utilisateur.rcExpireLe ?? null,
      rcValide: assuranceRcValide(utilisateur.rcExpireLe, aujourdHui),
      rcJours: joursAvantExpirationRc(utilisateur.rcExpireLe, aujourdHui),
    })),
    actifs: utilisateurs.filter((utilisateur) => utilisateur.actif).length,
    admins: utilisateurs.filter(
      (utilisateur) => utilisateur.actif && utilisateur.role === "admin",
    ).length,
    roles: ROLES_UTILISATEUR.map((role) => ({
      id: role,
      label: LIBELLES_ROLE[role],
    })),
    deuxfacteurs: event.url.searchParams.get("deuxfacteurs"),
  };
};

export const actions = {
  creer: async (event) => {
    const session = requireRole(event, ["admin"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    try {
      const utilisateur = await new CreerUtilisateur(
        new DrizzleUserRepository(),
      ).executer({
        tenantId,
        name: texte(donnees, "name"),
        email: texte(donnees, "email"),
        role: texte(donnees, "role"),
        password: String(donnees.get("password") ?? ""),
        acteurRole: roleActeur(session),
      });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "utilisateur.creer",
          cible: utilisateur.id,
          payload: { role: utilisateur.role },
        }),
      );
      return { ok: true, message: `Compte créé pour ${utilisateur.email}.` };
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) return fail(400, { message: error.message });
      if (emailDejaUtilise(error)) {
        return fail(400, { message: "Un compte utilise déjà cette adresse email." });
      }
      logErreur("utilisateurs.creer", error, { tenantId });
      return fail(500, { message: "Erreur inattendue. Réessayez." });
    }
  },

  actif: async (event) => {
    const session = requireRole(event, ["admin"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = texte(donnees, "userId");
    const actif = texte(donnees, "actif") === "true";
    try {
      const utilisateur = await new ChangerActifUtilisateur(
        new DrizzleUserRepository(),
      ).executer({
        tenantId,
        id,
        actif,
        acteurId: session.user.id,
        acteurRole: roleActeur(session),
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
      return {
        ok: true,
        userId: utilisateur.id,
        message: actif
          ? `Compte de ${utilisateur.email} réactivé.`
          : `Compte de ${utilisateur.email} désactivé. Ses sessions sont fermées.`,
      };
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) return fail(400, { message: error.message });
      logErreur("utilisateurs.actif", error, { tenantId, id });
      return fail(500, { message: "Erreur inattendue." });
    }
  },

  role: async (event) => {
    const session = requireRole(event, ["admin"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = texte(donnees, "userId");
    try {
      const utilisateur = await new ChangerRoleUtilisateur(
        new DrizzleUserRepository(),
      ).executer({
        tenantId,
        id,
        role: texte(donnees, "role"),
        acteurId: session.user.id,
        acteurRole: roleActeur(session),
      });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "utilisateur.role",
          cible: utilisateur.id,
          payload: { role: utilisateur.role },
        }),
      );
      return {
        ok: true,
        userId: utilisateur.id,
        message: `Rôle de ${utilisateur.email} changé en ${libelleRole(utilisateur.role)}.`,
      };
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) return fail(400, { message: error.message });
      logErreur("utilisateurs.role", error, { tenantId, id });
      return fail(500, { message: "Erreur inattendue." });
    }
  },

  motdepasse: async (event) => {
    const session = requireRole(event, ["admin"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = texte(donnees, "userId");
    const password = String(donnees.get("password") ?? "");
    const confirmation = String(donnees.get("confirmation") ?? "");
    if (password !== confirmation) {
      return fail(400, { message: "Les deux mots de passe ne correspondent pas." });
    }
    if (id === session.user.id) {
      return fail(400, {
        message: "Pour votre propre compte, utilisez la page Sécurité.",
      });
    }
    try {
      const utilisateur = await new ReinitialiserMotDePasse(
        new DrizzleUserRepository(),
      ).executer({
        tenantId,
        id,
        password,
        acteurRole: roleActeur(session),
      });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "utilisateur.motdepasse",
          cible: utilisateur.id,
          payload: { role: utilisateur.role },
        }),
      );
      return {
        ok: true,
        userId: utilisateur.id,
        message: `Mot de passe réinitialisé pour ${utilisateur.email}. Ses sessions ont été fermées.`,
      };
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) return fail(400, { message: error.message });
      logErreur("utilisateurs.motdepasse", error, { tenantId, id });
      return fail(500, { message: "Erreur inattendue." });
    }
  },

  rc: async (event) => {
    const session = requireRole(event, ["admin"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = texte(donnees, "userId");
    const valeur = texte(donnees, "rcExpireLe");
    const rcExpireLe = valeur || null;
    if (rcExpireLe && !/^\d{4}-\d{2}-\d{2}$/.test(rcExpireLe)) {
      return fail(400, { message: "Date de RC invalide (AAAA-MM-JJ)." });
    }
    try {
      const utilisateur = await new DrizzleUserRepository().definirRcExpireLe(
        tenantId,
        id,
        rcExpireLe,
      );
      if (!utilisateur) return fail(404, { message: "Compte introuvable." });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "utilisateur.rc",
          cible: utilisateur.id,
          payload: { rcExpireLe },
        }),
      );
      return {
        ok: true,
        userId: utilisateur.id,
        message: utilisateur.rcExpireLe
          ? `RC de ${utilisateur.email} valable jusqu’au ${utilisateur.rcExpireLe}.`
          : `RC retirée pour ${utilisateur.email} : dispatch bloqué.`,
      };
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("utilisateurs.rc", error, { tenantId, id });
      return fail(500, { message: "Erreur inattendue." });
    }
  },

  deuxfacteurs: async (event) => {    const session = requireRole(event, ["admin"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = texte(donnees, "userId");
    try {
      const utilisateur = await new ReinitialiserDeuxFacteurs(
        new DrizzleUserRepository(),
      ).executer({
        tenantId,
        id,
        acteurId: session.user.id,
        acteurRole: roleActeur(session),
      });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "utilisateur.2fa",
          cible: utilisateur.id,
          payload: {},
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) return fail(400, { message: error.message });
      logErreur("utilisateurs.2fa", error, { tenantId, id });
      return fail(500, { message: "Erreur inattendue." });
    }
    redirect(303, "/hote/utilisateurs?deuxfacteurs=ok");
  },
} satisfies Actions;
