import type { LayoutServerLoad } from "./$types";
import { apparencePourRequete } from "@/lib/server/apparence";
import { langueRequete } from "@/lib/server/langue";
import {
  lireConsentementRequete,
  suiviPourRequete,
} from "@/lib/server/suivi";

export const load: LayoutServerLoad = async (event) => {
  const { apparence, apercu } = await apparencePourRequete(event);
  const session = event.locals.session;
  const consentement = lireConsentementRequete(event);

  return {
    apparence,
    apercu,
    langue: langueRequete(event),
    lite: event.cookies.get("lcd_lite") === "1",
    cookiesOk: consentement !== null,
    consentement,
    suivi: await suiviPourRequete(event),
    utilisateur: session
      ? {
          id: session.user.id,
          email: session.user.email,
          nom: session.user.name,
          role: session.user.role,
          tenantId: session.user.tenantId,
        }
      : null,
  };
};
