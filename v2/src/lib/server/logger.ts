/**
 * Journal structuré serveur avec contexte tenant/request/canal.
 * Étend le logger de base (`src/lib/logger.ts`) en ajoutant les champs
 * de traçabilité obligatoires pour les opérations multi-tenant.
 *
 * Usage :
 *   const log = creerLogger({ tenantId, requestId, canal: "beds24" });
 *   log.info("sync.terminee", { duree_ms: 420 });
 *   log.erreur("sync.echec", erreur, { logementId });
 */

import { logErreur, logInfo } from "@/lib/logger";

export interface ContexteLogger {
  tenantId?: string;
  requestId?: string;
  canal?: string;
  [cle: string]: unknown;
}

export interface LoggerStructure {
  info(message: string, contexte?: Record<string, unknown>): void;
  erreur(message: string, erreur: unknown, contexte?: Record<string, unknown>): void;
}

/**
 * Crée un logger structuré pré-chargé avec un contexte de traçabilité.
 * Chaque appel de log.info/erreur fusionne le contexte de base avec le
 * contexte additionnel passé à l'appel.
 */
export function creerLogger(contexteBase: ContexteLogger = {}): LoggerStructure {
  const nettoyerContexte = (
    supplement?: Record<string, unknown>,
  ): Record<string, unknown> => {
    const fusion: Record<string, unknown> = {};
    for (const [cle, valeur] of Object.entries(contexteBase)) {
      if (valeur !== undefined) fusion[cle] = valeur;
    }
    if (supplement) {
      for (const [cle, valeur] of Object.entries(supplement)) {
        if (valeur !== undefined) fusion[cle] = valeur;
      }
    }
    return fusion;
  };

  return {
    info(message: string, contexte?: Record<string, unknown>): void {
      logInfo(message, nettoyerContexte(contexte));
    },
    erreur(message: string, erreur: unknown, contexte?: Record<string, unknown>): void {
      logErreur(message, erreur, nettoyerContexte(contexte));
    },
  };
}

/**
 * Génère un identifiant de requête unique pour corréler les logs
 * d'un même cycle de traitement (sync, webhook, batch).
 */
export function genererRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
