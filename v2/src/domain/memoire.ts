export const CONSERVATION_MOIS = 24;
export const PREFERENCES_MAX = 800;
export const NOM_MAX = 120;

export function dateExpiration(consentement: Date): Date {
  const expiration = new Date(consentement.getTime());
  expiration.setUTCMonth(expiration.getUTCMonth() + CONSERVATION_MOIS);
  return expiration;
}

export function memoireValide(
  expireAt: Date,
  maintenant = new Date(),
): boolean {
  return expireAt.getTime() > maintenant.getTime();
}

export function preferencesNormalisees(input: string): string {
  return input.replace(/\r\n/g, "\n").trim().slice(0, PREFERENCES_MAX);
}

export function nomMemoireValide(nom: string): boolean {
  const propre = nom.trim();
  return propre.length >= 2 && propre.length <= NOM_MAX;
}
