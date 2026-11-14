import type { RequestEvent } from "@sveltejs/kit";
import { estLangue, type Langue } from "@/lib/i18n-public";

export const LANGUE_DEFAUT: Langue = "fr";
export const COOKIE_LANGUE = "lcd_langue";

/**
 * Langue servie pour une requête : `?lang=` prioritaire, puis cookie, puis fr.
 * Aucune dépendance au JavaScript client : le serveur rend la bonne langue.
 */
export const langueRequete = (event: RequestEvent): Langue => {
  const parametre = event.url.searchParams.get("lang");
  if (estLangue(parametre)) return parametre;

  const cookie = event.cookies.get(COOKIE_LANGUE);
  if (estLangue(cookie)) return cookie;

  return LANGUE_DEFAUT;
};
