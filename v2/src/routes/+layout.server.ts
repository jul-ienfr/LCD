import type { LayoutServerLoad } from "./$types";
import { apparencePourRequete } from "@/lib/server/apparence";
import { langueRequete } from "@/lib/server/langue";
import { preferencesDepuis } from "@/lib/preferences";
import {
  lireConsentementRequete,
  suiviPourRequete,
} from "@/lib/server/suivi";

export const load: LayoutServerLoad = async (event) => {
  const { apparence, apercu } = await apparencePourRequete(event);
  const session = event.locals.session;
  const consentement = lireConsentementRequete(event);
  const langue = langueRequete(event);

  return {
    apparence,
    apercu,
    langue,
    // FR-043 : le mode, la densité et les notifications sont lus au plus tôt
    // pour que le serveur rende la page dans le bon rendu, sans clignotement.
    preferences: { ...preferencesDepuis(event.cookies), langue },
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
