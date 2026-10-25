import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

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

export async function requireRole(roles: readonly string[]) {
  const session = await requireSession();
  const role = session.user.role ?? "";
  if (!roles.includes(role)) redirect("/login?erreur=acces");
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
