/**
 * Flags de fonctionnalité par tenant (T011).
 *
 * Chaque flag contrôle l'accès à un module métier pour un tenant donné.
 * En développement, tous les flags sont actifs par défaut.
 * En production, la source de vérité est la colonne `flags` (jsonb) de la
 * table `tenants`. Ce module fournit une lecture typée + un repli sûr.
 *
 * Convention : un flag absent ou `false` = module désactivé pour ce tenant.
 * Les routes et use-cases vérifient le flag avant toute opération métier.
 *
 * Plan de retrait : supprimer ce fichier et les vérifications associées
 * quand tous les tenants ont tous les modules activés.
 */

export const FLAGS_TENANT = [
  "distribution",
  "site_paiement",
  "inbox",
  "pricing",
  "reporting",
  "api",
  "integrations",
] as const;

export type FlagTenant = (typeof FLAGS_TENANT)[number];

export type FlagsTenant = Partial<Record<FlagTenant, boolean>>;

/**
 * Vérifie si un flag est actif pour un tenant donné.
 * @param flags - L'objet flags du tenant (jsonb depuis la DB)
 * @param flag - Le flag à vérifier
 * @returns true si le flag est explicitement true, false sinon
 */
export function flagActif(flags: FlagsTenant | null | undefined, flag: FlagTenant): boolean {
  if (!flags) return false;
  return flags[flag] === true;
}

/**
 * Retourne les flags par défaut pour un nouveau tenant.
 * En développement : tout actif. En production : aucun actif par défaut
 * (le super-admin active les modules au fur et à mesure).
 */
export function flagsParDefaut(): FlagsTenant {
  const env = process.env.NODE_ENV ?? "development";
  if (env === "development" || env === "test") {
    const flags: FlagsTenant = {};
    for (const flag of FLAGS_TENANT) {
      flags[flag] = true;
    }
    return flags;
  }
  return {};
}

/**
 * Valide qu'un objet flags ne contient que des clés connues.
 * Utile pour rejeter une entrée utilisateur malformée.
 */
export function validerFlags(flags: unknown): FlagsTenant | null {
  if (flags === null || flags === undefined) return null;
  if (typeof flags !== "object" || Array.isArray(flags)) return null;
  const resultat: FlagsTenant = {};
  for (const [cle, valeur] of Object.entries(flags as Record<string, unknown>)) {
    if ((FLAGS_TENANT as readonly string[]).includes(cle)) {
      resultat[cle as FlagTenant] = valeur === true;
    }
  }
  return resultat;
}
