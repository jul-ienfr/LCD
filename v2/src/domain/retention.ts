/**
 * Rétention bornée des tables de trace (spec 006, FR-015).
 *
 * Chaque famille de données nommée par la spec a une rétention explicite,
 * appliquée par une purge planifiée (migration `0108_retention_bornee`).
 * L'audit garde sa rétention configurable (`AUDIT_RETENTION_JOURS`, plancher
 * 365 jours) ; les autres familles ont des durées fixes, alignées sur l'usage
 * réel : traces d'intégration, file de livraison, compteurs anti-abus.
 */

/** Événements canal (webhooks entrants) : 180 jours, échecs conservés. */
export const RETENTION_EVENEMENTS_CANAL_JOURS = 180;

/** Livraisons webhook (sortantes) : 90 jours, jamais une livraison due. */
export const RETENTION_LIVRAISONS_WEBHOOK_JOURS = 90;

/** Exécutions d'automatisation : 180 jours (le message reste la trace). */
export const RETENTION_EXECUTIONS_AUTOMATISATION_JOURS = 180;

/** Tentatives de connexion (anti-abus) : 30 jours, blocages actifs conservés. */
export const RETENTION_TENTATIVES_CONNEXION_JOURS = 30;
