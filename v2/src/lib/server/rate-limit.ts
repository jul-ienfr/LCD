/**
 * Rate limiter générique en mémoire (fenêtre glissante).
 * Protège les endpoints API, les appels fournisseur et les opérations
 * sensibles contre les abus. Pas de dépendance externe.
 *
 * Usage :
 *   const limiter = creerRateLimiter({ max: 10, fenetreMs: 60_000 });
 *   if (!limiter.autoriser("cle-unique")) { // 429 }
 */

export interface ConfigRateLimiter {
  /** Nombre maximum de requêtes dans la fenêtre */
  max: number;
  /** Durée de la fenêtre en millisecondes */
  fenetreMs: number;
}

export interface RateLimiter {
  /** Vérifie si la requête est autorisée et incrémente le compteur */
  autoriser(cle: string): boolean;
  /** Lit le nombre restant de requêtes sans consommer */
  restant(cle: string): number;
  /** Réinitialise une clé spécifique */
  reinitialiser(cle: string): void;
  /** Réinitialise tout (usage test) */
  vider(): void;
}

interface EntreeFenetre {
  timestamps: number[];
}

/**
 * Crée un rate limiter à fenêtre glissante.
 * Les entrées expirées sont purgées paresseusement à chaque appel.
 */
export function creerRateLimiter(config: ConfigRateLimiter): RateLimiter {
  const { max, fenetreMs } = config;
  const store = new Map<string, EntreeFenetre>();

  function purgerEntree(entree: EntreeFenetre, maintenant: number): void {
    const seuil = maintenant - fenetreMs;
    entree.timestamps = entree.timestamps.filter((t) => t > seuil);
  }

  function obtenirEntree(cle: string, maintenant: number): EntreeFenetre {
    let entree = store.get(cle);
    if (!entree) {
      entree = { timestamps: [] };
      store.set(cle, entree);
    }
    purgerEntree(entree, maintenant);
    return entree;
  }

  return {
    autoriser(cle: string): boolean {
      const maintenant = Date.now();
      const entree = obtenirEntree(cle, maintenant);
      if (entree.timestamps.length >= max) {
        return false;
      }
      entree.timestamps.push(maintenant);
      return true;
    },

    restant(cle: string): number {
      const maintenant = Date.now();
      const entree = obtenirEntree(cle, maintenant);
      return Math.max(0, max - entree.timestamps.length);
    },

    reinitialiser(cle: string): void {
      store.delete(cle);
    },

    vider(): void {
      store.clear();
    },
  };
}

/**
 * Pré-configure des limiters courants pour le projet.
 * Utile pour centraliser les quotas sans créer un limiter à chaque import.
 */
export const LIMITES_DEFAUT = {
  /** API publique : 60 req/min par IP */
  apiPublique: () => creerRateLimiter({ max: 60, fenetreMs: 60_000 }),
  /** Login : 5 tentatives par fenêtre CAPTCHA (15 min par défaut) */
  login: () => creerRateLimiter({ max: 5, fenetreMs: 15 * 60_000 }),
  /** Webhooks fournisseur : 120 req/min par fournisseur */
  webhook: () => creerRateLimiter({ max: 120, fenetreMs: 60_000 }),
  /** Sync fournisseur : 10 push/min par logement */
  syncFournisseur: () => creerRateLimiter({ max: 10, fenetreMs: 60_000 }),
} as const;
