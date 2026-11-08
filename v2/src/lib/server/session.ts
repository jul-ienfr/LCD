import { redirect, type RequestEvent } from "@sveltejs/kit";
import { deuxFacteursRequis } from "@/domain/securite";
import { emailDansAllowlistSuperAdmin } from "@/domain/utilisateur";
import { env } from "@/lib/env";
import { lireApercu } from "@/lib/server/apercu";

export type SessionApp = NonNullable<App.Locals["session"]>;

export function estSuperAdmin(
  session: { user: { role?: string | null; email?: string | null } } | null,
): boolean {
  if (!session) return false;
  return (
    session.user.role === "super_admin" ||
    emailDansAllowlistSuperAdmin(session.user.email, env.SUPER_ADMIN_EMAILS)
  );
}

/**
 * Garde des endpoints API staff : renvoie une réponse 401/403 au lieu de
 * rediriger. Applique la même exigence 2FA que requireRole, y compris sur les
 * exports et PDF qui ne passent pas par une page.
 */
export function verifierAccesApi(
  session: SessionApp | null | undefined,
  roles: readonly string[],
): Response | null {
  if (!session || session.user.actif === false) {
    return new Response("Non autorisé", { status: 401 });
  }
  const roleBrut = session.user.role ?? "";
  const role = roleBrut === "operateur" ? "hote" : roleBrut;
  if (!estSuperAdmin(session) && !roles.includes(role)) {
    return new Response("Accès refusé", { status: 403 });
  }
  if (
    deuxFacteursRequis(
      role,
      Boolean(session.user.twoFactorEnabled),
      env.AUTH_2FA_REQUIRED,
    )
  ) {
    return new Response("Double authentification requise", { status: 403 });
  }
  return null;
}

export function requireSession(event: RequestEvent): SessionApp {
  const session = event.locals.session;
  if (!session || session.user.actif === false) {
    redirect(303, "/login");
  }
  return session;
}

export function requireRole(
  event: RequestEvent,
  roles: readonly string[],
): SessionApp {
  const session = requireSession(event);
  const apercu = lireApercu(event, session);
  const roleBrut = apercu?.role ?? session.user.role ?? "";
  // L'opérateur est le rôle terrain historique : il agit comme un hôte sans
  // accéder aux écrans réservés aux administrateurs.
  const role = roleBrut === "operateur" ? "hote" : roleBrut;

  if (apercu && event.request.method !== "GET") {
    redirect(303, "/preview/lecture-seule");
  }
  if (role !== "super_admin" && !roles.includes(role)) {
    redirect(303, "/login?erreur=acces");
  }
  if (
    deuxFacteursRequis(
      session.user.role ?? "",
      Boolean(session.user.twoFactorEnabled),
      env.AUTH_2FA_REQUIRED,
    )
  ) {
    redirect(303, "/hote/securite?deuxfacteurs=requis");
  }
  return session;
}

export function requireSuperAdmin(event: RequestEvent): SessionApp {
  const session = requireSession(event);
  if (!estSuperAdmin(session)) {
    redirect(303, "/login?erreur=acces");
  }
  if (
    deuxFacteursRequis(
      "super_admin",
      Boolean(session.user.twoFactorEnabled),
      env.AUTH_2FA_REQUIRED,
    )
  ) {
    redirect(303, "/hote/securite?deuxfacteurs=requis");
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

/** Page d’accueil du rôle : évite la boucle /login → /hote → /login. */
export function destinationRole(role?: string | null): string {
  if (role === "presta") return "/presta";
  if (role === "proprietaire") return "/proprio";
  if (role === "commercial") return "/commercial";
  return "/hote";
}