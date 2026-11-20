import {
  lireEtatMaintenance,
  type EtatMaintenance,
  MAINTENANCE_DESACTIVEE,
} from "@/domain/maintenance";
import { DrizzleParametresSiteRepository } from "@/infrastructure/db/repositories/parametres-site-repository";
import { logErreur } from "@/lib/logger";

/**
 * FR-017 (spec 006) — lecture du mode maintenance global.
 *
 * L'état vit dans `parametres_site` (clé `maintenance`) : bascule sans
 * redéploiement. Le cache court (10 s) évite une requête base par requête
 * HTTP ; il est vidé par la page de supervision après chaque bascule pour que
 * l'effet soit immédiat pour l'exploitant qui vient d'agir.
 *
 * En cas d'erreur base, on laisse passer (mode désactivé) : fabriquer une
 * suspension sur une panne transitoire serait pire que le risque inverse.
 */
export const CLE_PARAMETRE_MAINTENANCE = "maintenance";

const DUREE_CACHE_MS = 10_000;
const depots = new DrizzleParametresSiteRepository();

let cache: { etat: EtatMaintenance; expire: number } | null = null;

/** Vide le cache (bascule depuis la supervision, tests). */
export function viderCacheMaintenance(): void {
  cache = null;
}

export async function lireMaintenance(): Promise<EtatMaintenance> {
  const maintenant = Date.now();
  if (cache && cache.expire > maintenant) return cache.etat;

  try {
    const brut = await depots.lire(CLE_PARAMETRE_MAINTENANCE);
    const etat = lireEtatMaintenance(brut);
    cache = { etat, expire: maintenant + DUREE_CACHE_MS };
    return etat;
  } catch (error) {
    logErreur("maintenance.lecture", error);
    return MAINTENANCE_DESACTIVEE;
  }
}
