// plugins/dash-admin/i18n.ts — dictionnaire du plugin (i18n préfixée §F3).
// Clés toutes prefixées "admin." (le chargeur refuse toute clé hors préfixe).
// Repli sur le dictionnaire CŒUR pour le vocabulaire partagé (DRY).
import { t as tCoeur, type Langue } from "@/lib/i18n";
import dict from "./i18n.json";

const DICT = dict as Record<string, Record<Langue, string>>;

export function t(cle: string, lang: Langue): string {
  return DICT[cle]?.[lang] ?? tCoeur(cle, lang);
}

export const CLE_PREFIXE = "admin." as const;
export type { Langue } from "@/lib/i18n";
