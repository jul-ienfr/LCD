/**
 * Référentiel unique des tâches planifiées (spec 006, FR-001).
 *
 * Chaque tâche déclarée ici est :
 *  - versionnée dans le dépôt (déclencheur unique) ;
 *  - suivie par `journal-execution.ts` (début, fin, statut, compteurs) ;
 *  - contrôlée par `verifierAbsencesTaches()` : absence au-delà de 2× la
 *    cadence = alerte (FR-002).
 *
 * Ajouter une tâche planifiée = ajouter une ligne ici ET l'enregistrer dans
 * son déclencheur (`executerTache`). Le test du référentiel vérifie que
 * chaque route de cron connue y figure.
 */

export interface TachePlanifiee {
  /** Identifiant stable, identique au nom utilisé dans le journal. */
  nom: string;
  /** Libellé humain pour /supervision. */
  libelle: string;
  /** Cadence attendue en minutes (déclencheur nominal). */
  cadenceMinutes: number;
  /** Route HTTP de déclenchement, si la tâche est déclenchable par cron. */
  route: string | null;
  /** Runbook associé (affiché dans l'alerte, FR-008). */
  runbook: string;
  /** Une absence de cette tâche est un incident d'exploitation. */
  critique: boolean;
}

const MINUTES = {
  cinq: 5,
  quart: 15,
  heure: 60,
  jour: 24 * 60,
  mois: 30 * 24 * 60,
} as const;

export const TACHES_PLANIFIEES: readonly TachePlanifiee[] = [
  {
    nom: "sync-ota",
    libelle: "Synchronisation OTA (ICS)",
    cadenceMinutes: MINUTES.cinq,
    route: "/api/cron/sync-ota",
    runbook: "runbook-production.md §crons",
    critique: true,
  },
  {
    nom: "sync-fournisseurs",
    libelle: "Synchronisation fournisseurs (channel manager)",
    cadenceMinutes: MINUTES.quart,
    route: "/api/cron/sync-fournisseurs",
    runbook: "runbook-production.md §crons",
    critique: true,
  },
  {
    nom: "sante-fournisseurs",
    libelle: "Sonde de santé fournisseurs",
    cadenceMinutes: MINUTES.quart,
    route: "/api/cron/sante-fournisseurs",
    runbook: "runbook-production.md §crons",
    critique: false,
  },
  {
    nom: "webhooks",
    libelle: "Livraison des webhooks sortants",
    cadenceMinutes: MINUTES.heure,
    route: "/api/cron/webhooks",
    runbook: "runbook-production.md §crons",
    critique: false,
  },
  {
    nom: "reconcile-fournisseurs",
    libelle: "Réconciliation fournisseurs",
    cadenceMinutes: MINUTES.jour,
    route: "/api/cron/reconcile-fournisseurs",
    runbook: "runbook-production.md §crons",
    critique: false,
  },
  {
    nom: "purge-police",
    libelle: "Purge des fiches de police expirées",
    cadenceMinutes: MINUTES.jour,
    route: "/api/cron/purge-police",
    runbook: "runbook-production.md §crons",
    critique: true,
  },
  {
    nom: "memoire",
    libelle: "Consolidation mémoire assistant",
    cadenceMinutes: MINUTES.jour,
    route: "/api/cron/memoire",
    runbook: "runbook-production.md §crons",
    critique: false,
  },
  {
    nom: "pricing",
    libelle: "Import des recommandations de prix",
    cadenceMinutes: MINUTES.jour,
    route: "/api/cron/pricing",
    runbook: "runbook-production.md §crons",
    critique: false,
  },
  {
    nom: "messages-auto",
    libelle: "Préparation des messages de séjour",
    cadenceMinutes: MINUTES.jour,
    route: "/api/cron/messages-auto",
    runbook: "runbook-production.md §crons",
    critique: false,
  },
  {
    nom: "relances",
    libelle: "Relances de factures",
    cadenceMinutes: MINUTES.jour,
    route: "/api/cron/relances",
    runbook: "runbook-production.md §crons",
    critique: false,
  },
  {
    nom: "relances-sejour",
    libelle: "Relances de séjour (paiements, paniers)",
    cadenceMinutes: MINUTES.jour,
    route: "/api/cron/relances-sejour",
    runbook: "runbook-production.md §crons",
    critique: false,
  },
  {
    nom: "releves",
    libelle: "Relevés propriétaires mensuels",
    cadenceMinutes: MINUTES.mois,
    route: "/api/cron/releves",
    runbook: "runbook-production.md §crons",
    critique: false,
  },
  {
    nom: "sauvegarde",
    libelle: "Sauvegarde quotidienne",
    cadenceMinutes: MINUTES.jour,
    route: null,
    runbook: "v2/BACKUPS.md",
    critique: true,
  },
  {
    nom: "restauration-controle",
    libelle: "Restauration de contrôle hebdomadaire",
    cadenceMinutes: 7 * MINUTES.jour,
    route: null,
    runbook: "v2/BACKUPS.md",
    critique: false,
  },
  {
    nom: "verifier-taches",
    libelle: "Contrôle d'absence des tâches et des briques de supervision",
    cadenceMinutes: 30,
    route: "/api/cron/verifier-taches",
    runbook: "v2/MONITORING.md",
    critique: true,
  },
  {
    nom: "jobs-outbox",
    libelle: "File de jobs durable (drain, retries, purges)",
    cadenceMinutes: MINUTES.cinq,
    route: "/api/cron/jobs-outbox",
    runbook: "v2/runbook-production.md §crons",
    critique: true,
  },
] as const;

export function tacheParNom(nom: string): TachePlanifiee | null {
  return TACHES_PLANIFIEES.find((tache) => tache.nom === nom) ?? null;
}

/** Rétention du journal d'exécution (FR-015), en jours. */
export const RETENTION_EXECUTIONS_JOURS = 90;
