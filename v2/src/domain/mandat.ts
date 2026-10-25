import { dateIsoValide } from "./calendrier";

export const MODES_MANDAT = ["propre", "mandat_tiers"] as const;
export type ModeMandat = (typeof MODES_MANDAT)[number];

export const STATUTS_MANDAT = ["actif", "suspendu"] as const;
export type StatutMandat = (typeof STATUTS_MANDAT)[number];

export const LIBELLES_MODE_MANDAT: Record<ModeMandat, string> = {
  propre: "Bien propre (0 commission)",
  mandat_tiers: "Mandat tiers",
};

export const LIBELLES_STATUT_MANDAT: Record<StatutMandat, string> = {
  actif: "Actif",
  suspendu: "Suspendu",
};

export function modeMandatValide(valeur: string): valeur is ModeMandat {
  return (MODES_MANDAT as readonly string[]).includes(valeur);
}

export function statutMandatValide(valeur: string): valeur is StatutMandat {
  return (STATUTS_MANDAT as readonly string[]).includes(valeur);
}

export function datesMandatValides(
  debut: string | null | undefined,
  fin: string | null | undefined,
): boolean {
  if (debut && !dateIsoValide(debut)) return false;
  if (fin && !dateIsoValide(fin)) return false;
  if (debut && fin && fin < debut) return false;
  return true;
}

export function notesMandatValides(
  notes: string | null | undefined,
): boolean {
  return (notes?.trim().length ?? 0) <= 1_000;
}
