// plugins/dash-operateur/i18n.ts — dictionnaire du plugin (i18n préfixée §F3).
// Les clés sont toutes prefixées "operateur." (contrôle : le chargeur refuse
// toute clé hors préfixe). Repli sur le dictionnaire CŒUR pour les clés
// partagées (envoyer, qui, choisir_logement...) — DRY : une clé = un seul
// endroit, le cœur garde le vocabulaire commun.
import { t as tCoeur, type Langue } from "@/lib/i18n";
import dict from "./i18n.json";

const DICT = dict as Record<string, Record<Langue, string>>;

export function t(cle: string, lang: Langue): string {
  return DICT[cle]?.[lang] ?? tCoeur(cle, lang);
}

export const CLE_PREFIXE = "operateur." as const;
export type { Langue } from "@/lib/i18n";
