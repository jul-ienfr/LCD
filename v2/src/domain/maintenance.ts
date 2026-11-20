/**
 * FR-017 (spec 006) — mode maintenance global : règles pures.
 *
 * L'état vit dans `parametres_site` (clé `maintenance`) : la bascule prend
 * effet sans redéploiement. Ces fonctions décident, à partir du chemin et de
 * l'état, si une requête est suspendue. Le super-admin n'est jamais suspendu :
 * il doit pouvoir constater la panne, corriger, puis rouvrir.
 *
 * Restent joignables pendant la suspension, parce que les couper serait pire
 * que le problème qu'on traite :
 * - la console de supervision (bascule, état) ;
 * - la connexion et la sortie (le super-admin doit pouvoir entrer) ;
 * - les sondes (`/api/health`, `/api/ready`, `/api/metrics`) : la supervision
 *   externe doit voir un site vivant, pas un site muet ;
 * - la résolution de domaine interne (`/api/domaine`, appelée par `reroute`) ;
 * - les tâches planifiées (`/api/cron/*` : sauvegardes, purges, synchronisations) ;
 * - les webhooks entrants (Stripe, fournisseurs) : un événement manqué est une
 *   donnée perdue, jamais rejouable côté tiers.
 */

export interface EtatMaintenance {
  actif: boolean;
  /** Message libre affiché sur la page dédiée (500 caractères au plus). */
  message: string | null;
  /** Horodatage ISO de l'activation en cours. */
  debutLe: string | null;
  /** Auteur de l'activation en cours. */
  par: string | null;
}

export const MAINTENANCE_DESACTIVEE: EtatMaintenance = {
  actif: false,
  message: null,
  debutLe: null,
  par: null,
};

export const MESSAGE_MAINTENANCE_MAX = 500;

/** Préfixes qui échappent à la suspension (chemin exact ou sous-chemin). */
const CHEMINS_EXEMPTES = [
  "/supervision",
  "/login",
  "/logout",
  "/two-factor",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
  "/api/auth",
  "/api/health",
  "/api/ready",
  "/api/metrics",
  "/api/domaine",
  "/api/cron",
  "/api/stripe",
  "/api/fournisseurs",
] as const;

export function cheminExempteMaintenance(chemin: string): boolean {
  return CHEMINS_EXEMPTES.some(
    (prefixe) => chemin === prefixe || chemin.startsWith(`${prefixe}/`),
  );
}

/**
 * Une requête est suspendue quand le mode est actif, que la session n'est pas
 * super-admin et que le chemin n'est pas exempté. Les visiteurs anonymes sont
 * suspendus : c'est le cas nominal d'un mode maintenance global.
 */
export function doitSuspendreMaintenance(input: {
  chemin: string;
  actif: boolean;
  superAdmin: boolean;
}): boolean {
  if (!input.actif) return false;
  if (input.superAdmin) return false;
  return !cheminExempteMaintenance(input.chemin);
}

/** Nettoie un message saisi : vide → `null`, borné à 500 caractères. */
export function normaliserMessageMaintenance(valeur: unknown): string | null {
  if (typeof valeur !== "string") return null;
  const propre = valeur.trim().slice(0, MESSAGE_MAINTENANCE_MAX);
  return propre.length > 0 ? propre : null;
}

/**
 * Relit l'état stocké. Toute forme inattendue (JSON invalide, `actif` non
 * booléen) retombe sur « désactivé » : un mode maintenance qui s'active sur
 * une donnée corrompue serait une panne fabriquée par la supervision.
 */
export function lireEtatMaintenance(
  brut: string | null | undefined,
): EtatMaintenance {
  if (!brut) return MAINTENANCE_DESACTIVEE;
  try {
    const donnees = JSON.parse(brut) as Record<string, unknown>;
    if (donnees.actif !== true) return MAINTENANCE_DESACTIVEE;
    return {
      actif: true,
      message: normaliserMessageMaintenance(donnees.message),
      debutLe: typeof donnees.debutLe === "string" ? donnees.debutLe : null,
      par: typeof donnees.par === "string" ? donnees.par : null,
    };
  } catch {
    return MAINTENANCE_DESACTIVEE;
  }
}

export function serialiserEtatMaintenance(etat: EtatMaintenance): string {
  return JSON.stringify({
    actif: etat.actif,
    message: normaliserMessageMaintenance(etat.message),
    debutLe: etat.debutLe,
    par: etat.par,
  });
}
