export const NATURES_ENTITE = [
  "nom_propre",
  "sci_IS",
  "sci_IR",
  "sasu",
  "eurl",
  "sarl",
  "sa",
  "snc",
  "association",
] as const;

export type NatureEntite = (typeof NATURES_ENTITE)[number];

export const REGIMES_ENTITE = [
  "micro_bic_non_classe",
  "micro_bic_classe",
  "micro_bnc",
  "reel_simplifie",
  "is_2065",
  "is_2066",
] as const;

export type RegimeEntite = (typeof REGIMES_ENTITE)[number];

export const TVA_ENTITE = ["non", "franchise", "reelle"] as const;
export type TvaEntite = (typeof TVA_ENTITE)[number];

export const LIBELLES_NATURE: Record<NatureEntite, string> = {
  nom_propre: "Nom propre",
  sci_IS: "SCI à l’IS",
  sci_IR: "SCI à l’IR",
  sasu: "SASU",
  eurl: "EURL",
  sarl: "SARL",
  sa: "SA",
  snc: "SNC",
  association: "Association",
};

export const LIBELLES_REGIME: Record<RegimeEntite, string> = {
  micro_bic_non_classe: "Micro-BIC non classé",
  micro_bic_classe: "Micro-BIC classé",
  micro_bnc: "Micro-BNC",
  reel_simplifie: "Réel simplifié",
  is_2065: "IS 2065",
  is_2066: "IS 2066",
};

export const LIBELLES_TVA: Record<TvaEntite, string> = {
  non: "Non assujetti",
  franchise: "Franchise en base",
  reelle: "TVA réelle",
};

export function natureEntiteValide(
  valeur: string,
): valeur is NatureEntite {
  return (NATURES_ENTITE as readonly string[]).includes(valeur);
}

export function regimeEntiteValide(
  valeur: string,
): valeur is RegimeEntite {
  return (REGIMES_ENTITE as readonly string[]).includes(valeur);
}

export function tvaEntiteValide(valeur: string): valeur is TvaEntite {
  return (TVA_ENTITE as readonly string[]).includes(valeur);
}

export function nomEntiteValide(nom: string): boolean {
  const valeur = nom.trim();
  return valeur.length >= 2 && valeur.length <= 120;
}

export function sirenValide(siren: string | null | undefined): boolean {
  const valeur = siren?.trim() ?? "";
  return valeur === "" || /^\d{9}$/u.test(valeur);
}

export function adresseEntiteValide(adresse: string | null | undefined): boolean {
  return (adresse?.trim().length ?? 0) <= 500;
}

export function mentionsEntiteValides(
  mentions: string | null | undefined,
): boolean {
  return (mentions?.trim().length ?? 0) <= 2_000;
}
