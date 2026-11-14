import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

/**
 * T610 — Installation PWA et notifications.
 *
 * Page staff dédiée : le manifest et le service worker sont déjà servis par
 * l'application ; cette page explique l'installation et propose l'activation
 * des notifications lorsque le navigateur le permet.
 */
export const load: PageServerLoad = (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  tenantIdDeSession(session);
  return {
    email: session.user.email,
  };
};
