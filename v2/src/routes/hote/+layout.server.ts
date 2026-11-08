import type { LayoutServerLoad } from "./$types";
import { libelleRole } from "@/domain/utilisateur";
import { apparencePourRequete } from "@/lib/server/apparence";
import { traductionsNavigation } from "@/lib/i18n-nav";
import { lireApercu } from "@/lib/server/apercu";
import { estSuperAdmin, requireSession } from "@/lib/server/session";

export const load: LayoutServerLoad = async (event) => {
  const session = requireSession(event);
  const apercu = lireApercu(event, session);
  const { apparence } = await apparencePourRequete(event);
  const langue = event.cookies.get("lcd_langue") ?? "fr";

  return {
    apparence,
    langue,
    tNav: traductionsNavigation(langue),
    chemin: event.url.pathname,
    apercu: apercu
      ? { role: apercu.role, libelle: libelleRole(apercu.role) }
      : null,
    superAdmin: estSuperAdmin(session) && !apercu,
    utilisateur: {
      nom: session.user.name,
      email: session.user.email,
      role: apercu?.role ?? session.user.role ?? "",
      tenantId: session.user.tenantId ?? "",
    },
  };
};
