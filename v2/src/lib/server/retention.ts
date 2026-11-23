/**
 * Purges de rétention bornée (spec 006, FR-015/FR-016).
 *
 * Sept familles, une fonction SQL bornée chacune (migrations 0108/0109/0110,
 * SECURITY DEFINER : les tables sous RLS ne sont jamais supprimées par un
 * DELETE applicatif direct). Une purge qui échoue ne bloque pas les autres :
 * chaque famille est isolée, l'échec est tracé et remonté dans `echecs`.
 *
 * Appelé par le cron `/api/cron/verifier-taches` et par le planificateur
 * in-process : idempotent, un double passage ne supprime rien de plus.
 */

import { sql } from "drizzle-orm";
import {
  RETENTION_EVENEMENTS_CANAL_JOURS,
  RETENTION_EXECUTIONS_AUTOMATISATION_JOURS,
  RETENTION_JOBS_OUTBOX_JOURS,
  RETENTION_JOURNAUX_APPLICATIFS_JOURS,
  RETENTION_LIVRAISONS_WEBHOOK_JOURS,
  RETENTION_TENTATIVES_CONNEXION_JOURS,
} from "@/domain/retention";
import { db } from "@/infrastructure/db/client";
import { env } from "@/lib/env";
import { logErreur, logInfo } from "@/lib/logger";

export interface ResultatPurgesRetention {
  audit: number;
  evenementsCanal: number;
  livraisonsWebhook: number;
  executionsAutomatisation: number;
  tentativesConnexion: number;
  journauxApplicatifs: number;
  jobsOutbox: number;
  /** Tables dont la purge a échoué (les autres ont tourné). */
  echecs: string[];
}

/** Purge d'une famille : jours de rétention → lignes supprimées. */
export type PurgeRetention = (jours: number) => Promise<number>;

export interface PurgesRetentionInjectees {
  audit?: PurgeRetention;
  evenementsCanal?: PurgeRetention;
  livraisonsWebhook?: PurgeRetention;
  executionsAutomatisation?: PurgeRetention;
  tentativesConnexion?: PurgeRetention;
  journauxApplicatifs?: PurgeRetention;
  jobsOutbox?: PurgeRetention;
}

async function compter(lignes: unknown): Promise<number> {
  return Number((lignes as { supprimees: number }[])[0]?.supprimees ?? 0);
}

async function purgerAuditLogs(jours: number): Promise<number> {
  return compter(
    await db.execute(sql`select purger_audit_logs(${jours}) as supprimees`),
  );
}

async function purgerEvenementsCanal(jours: number): Promise<number> {
  return compter(
    await db.execute(
      sql`select purger_evenements_canal(${jours}) as supprimees`,
    ),
  );
}

async function purgerLivraisonsWebhook(jours: number): Promise<number> {
  return compter(
    await db.execute(
      sql`select purger_livraisons_webhook(${jours}) as supprimees`,
    ),
  );
}

async function purgerExecutionsAutomatisation(jours: number): Promise<number> {
  return compter(
    await db.execute(
      sql`select purger_executions_automatisation(${jours}) as supprimees`,
    ),
  );
}

async function purgerTentativesConnexion(jours: number): Promise<number> {
  return compter(
    await db.execute(
      sql`select purger_tentatives_connexion(${jours}) as supprimees`,
    ),
  );
}

async function purgerJournauxApplicatifs(jours: number): Promise<number> {
  return compter(
    await db.execute(
      sql`select purger_journaux_applicatifs(${jours}) as supprimees`,
    ),
  );
}

async function purgerJobsOutbox(jours: number): Promise<number> {
  return compter(
    await db.execute(
      sql`select purger_jobs_outbox(${jours}) as supprimees`,
    ),
  );
}

export async function purgerRetentions(
  injectees: PurgesRetentionInjectees = {},
): Promise<ResultatPurgesRetention> {
  const familles: {
    cle: keyof Omit<ResultatPurgesRetention, "echecs">;
    table: string;
    purge: PurgeRetention;
    jours: number;
  }[] = [
    {
      cle: "audit",
      table: "audit_logs",
      purge: injectees.audit ?? purgerAuditLogs,
      jours: env.AUDIT_RETENTION_JOURS,
    },
    {
      cle: "evenementsCanal",
      table: "evenements_canal",
      purge: injectees.evenementsCanal ?? purgerEvenementsCanal,
      jours: RETENTION_EVENEMENTS_CANAL_JOURS,
    },
    {
      cle: "livraisonsWebhook",
      table: "webhook_deliveries",
      purge: injectees.livraisonsWebhook ?? purgerLivraisonsWebhook,
      jours: RETENTION_LIVRAISONS_WEBHOOK_JOURS,
    },
    {
      cle: "executionsAutomatisation",
      table: "executions_automatisation",
      purge: injectees.executionsAutomatisation ?? purgerExecutionsAutomatisation,
      jours: RETENTION_EXECUTIONS_AUTOMATISATION_JOURS,
    },
    {
      cle: "tentativesConnexion",
      table: "tentatives_connexion",
      purge: injectees.tentativesConnexion ?? purgerTentativesConnexion,
      jours: RETENTION_TENTATIVES_CONNEXION_JOURS,
    },
    {
      cle: "journauxApplicatifs",
      table: "journaux_applicatifs",
      purge: injectees.journauxApplicatifs ?? purgerJournauxApplicatifs,
      jours: RETENTION_JOURNAUX_APPLICATIFS_JOURS,
    },
    {
      cle: "jobsOutbox",
      table: "jobs_outbox",
      purge: injectees.jobsOutbox ?? purgerJobsOutbox,
      jours: RETENTION_JOBS_OUTBOX_JOURS,
    },
  ];

  const resultat: ResultatPurgesRetention = {
    audit: 0,
    evenementsCanal: 0,
    livraisonsWebhook: 0,
    executionsAutomatisation: 0,
    tentativesConnexion: 0,
    journauxApplicatifs: 0,
    jobsOutbox: 0,
    echecs: [],
  };

  for (const famille of familles) {
    try {
      const supprimees = await famille.purge(famille.jours);
      resultat[famille.cle] = supprimees;
      if (supprimees > 0) {
        logInfo("retention.purge", {
          table: famille.table,
          supprimees,
          retentionJours: famille.jours,
        });
      }
    } catch (erreur) {
      resultat.echecs.push(famille.table);
      logErreur("retention.purge", erreur, { table: famille.table });
    }
  }

  return resultat;
}
