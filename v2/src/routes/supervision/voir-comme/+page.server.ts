import { isRedirect, redirect } from "@sveltejs/kit";
import { ROLES_APERCU, roleApercuValide } from "@/domain/apercu";
import { libelleRole } from "@/domain/utilisateur";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { lireApercu, poserCookieApercu } from "@/lib/server/apercu";
import { requireSuperAdmin, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const session = requireSuperAdmin(event);
  const apercu = lireApercu(event, session);

  return {
    apercu: apercu
      ? {
          role: apercu.role,
          libelle: libelleRole(apercu.role),
          email: apercu.email,
          expire: new Date(apercu.exp * 1000).toLocaleString("fr-FR"),
        }
      : null,
    roles: ROLES_APERCU.map((role) => ({ id: role, libelle: libelleRole(role) })),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  demarrer: async (event) => {
    const session = requireSuperAdmin(event);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const role = String(donnees.get("role") ?? "");
    const email = session.user.email;

    if (!roleApercuValide(role)) {
      redirect(303, "/supervision/voir-comme?erreur=role");
    }
    if (!email) {
      redirect(303, "/supervision/voir-comme?erreur=email");
    }

    poserCookieApercu(event, email, role);
    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: email,
        action: "apercu.demarrer",
        cible: role,
        ref: `apercu-${crypto.randomUUID()}`,
        payload: { role, email_reel: email },
      }),
    );

    redirect(303, "/hote");
  },
} satisfies Actions;
