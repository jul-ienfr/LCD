import { estLangue, type Langue } from "./i18n-public";

/**
 * Préférences utilisateur (spec 006, FR-043).
 *
 * Trois réglages personnels accompagnent la langue déjà servie par
 * `lcd_langue` : le mode d'apparence (système, clair, sombre), la densité
 * (confortable, compacte) et l'activation des notifications in-app (FR-042).
 *
 * Tout est stocké en cookie, comme la langue : le serveur rend la page dans le
 * bon mode dès la première réponse, sans script de bascule ni clignotement.
 * Les valeurs sont validées ici, avant toute écriture de cookie, pour qu'une
 * valeur forgée ne puisse pas changer le rendu.
 */

export const COOKIE_MODE = "lcd_theme";
export const COOKIE_DENSITE = "lcd_densite";
export const COOKIE_NOTIFICATIONS = "lcd_notifications";

export const MODES_APPARENCE = ["systeme", "clair", "sombre"] as const;
export type ModeApparence = (typeof MODES_APPARENCE)[number];

export const DENSITES = ["confortable", "compacte"] as const;
export type DensitePref = (typeof DENSITES)[number];

export interface Preferences {
  langue: Langue;
  mode: ModeApparence;
  densite: DensitePref;
  notifications: boolean;
}

export const PREFERENCES_DEFAUT: Omit<Preferences, "langue"> = {
  mode: "systeme",
  densite: "confortable",
  notifications: true,
};

export function estModeApparence(valeur: unknown): valeur is ModeApparence {
  return (
    typeof valeur === "string" &&
    (MODES_APPARENCE as readonly string[]).includes(valeur)
  );
}

export function estDensite(valeur: unknown): valeur is DensitePref {
  return (
    typeof valeur === "string" &&
    (DENSITES as readonly string[]).includes(valeur)
  );
}

/** Lit les préférences d'un magasin de cookies, en retombant sur le défaut. */
export function preferencesDepuis(cookies: {
  get(nom: string): string | undefined;
}): Preferences {
  const mode = cookies.get(COOKIE_MODE);
  const densite = cookies.get(COOKIE_DENSITE);
  const notifications = cookies.get(COOKIE_NOTIFICATIONS);
  const langue = cookies.get("lcd_langue");
  return {
    langue: estLangue(langue) ? langue : "fr",
    mode: estModeApparence(mode) ? mode : PREFERENCES_DEFAUT.mode,
    densite: estDensite(densite) ? densite : PREFERENCES_DEFAUT.densite,
    notifications: notifications !== "0",
  };
}

export interface CookiePreference {
  nom: string;
  valeur: string;
  maxAge: number;
}

/** Cookies à poser pour mémoriser un choix (un an, même politique partout). */
export function cookiesPreferences(
  preferences: Pick<Preferences, "mode" | "densite" | "notifications">,
): CookiePreference[] {
  return [
    { nom: COOKIE_MODE, valeur: preferences.mode, maxAge: 365 * 24 * 60 * 60 },
    {
      nom: COOKIE_DENSITE,
      valeur: preferences.densite,
      maxAge: 365 * 24 * 60 * 60,
    },
    {
      nom: COOKIE_NOTIFICATIONS,
      valeur: preferences.notifications ? "1" : "0",
      maxAge: 365 * 24 * 60 * 60,
    },
  ];
}
