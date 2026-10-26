import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { deuxFacteursRequis } from "@/domain/securite";
import { emailDansAllowlistSuperAdmin } from "@/domain/utilisateur";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  // Défense en profondeur : même si une session survivait à une désactivation,
  // le compte inactif n'ouvre aucune page protégée.
  if (!session || session.user.actif === false) redirect("/login");
  return session;
}

export function estSuperAdmin(session: {
  user: { role?: string | null; email?: string | null };
}): boolean {
  return (
    session.user.role === "super_admin" ||
    emailDansAllowlistSuperAdmin(session.user.email, env.SUPER_ADMIN_EMAILS)
  );
}

export async function requireRole(roles: readonly string[]) {
  const session = await requireSession();
  const role = session.user.role ?? "";
  if (role !== "super_admin" && !roles.includes(role)) {
    redirect("/login?erreur=acces");
  }
  if (
    deuxFacteursRequis(
      role,
      Boolean(session.user.twoFactorEnabled),
      env.AUTH_2FA_REQUIRED,
    )
  ) {
    redirect("/hote/securite?deuxfacteurs=requis");
  }
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireSession();
  if (!estSuperAdmin(session)) redirect("/login?erreur=acces");
  if (
    deuxFacteursRequis(
      "super_admin",
      Boolean(session.user.twoFactorEnabled),
      env.AUTH_2FA_REQUIRED,
    )
  ) {
    redirect("/hote/securite?deuxfacteurs=requis");
  }
  return session;
}

export function tenantIdDeSession(session: {
  user: { tenantId?: string | null };
}): string {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    throw new Error("Session sans tenantId : compte mal configuré.");
  }
  return tenantId;
}
