import type { LayoutServerLoad } from "./$types";
import { apparencePourRequete } from "@/lib/server/apparence";

export const load: LayoutServerLoad = async (event) => {
  const { apparence, apercu } = await apparencePourRequete(event);
  const session = event.locals.session;

  return {
    apparence,
    apercu,
    lite: event.cookies.get("lcd_lite") === "1",
    cookiesOk: event.cookies.get("lcd_cookies_ok") === "1",
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
