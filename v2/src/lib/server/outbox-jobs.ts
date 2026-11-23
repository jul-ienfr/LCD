/**
 * Worker de la file de jobs durable (spec 006, FR-025).
 *
 * Les jobs critiques sont écrits dans `jobs_outbox` par `QueueOutbox` puis
 * réclamés ici, jamais exécutés depuis une minuterie mémoire seule. Un
 * redémarrage laisse la ligne en base : le passage suivant la reprend.
 *
 * Deux garanties de concurrence :
 *  - réclamation atomique `FOR UPDATE SKIP LOCKED` + statut `en_cours` avec
 *    bail : deux workers ne traitent jamais la même ligne ;
 *  - bail expiré = worker mort : la ligne repasse `en_attente` au passage
 *    suivant, sans perdre la tentative.
 *
 * Les dates ne sont jamais lues par `db.execute` (le pilote les rendrait en
 * chaîne) : seuls id, nom, payload et compteurs sortent du SQL brut ; l'heure
 * est injectée et portée par le query builder.
 */

import { and, eq, lte, sql } from "drizzle-orm";
import { apresEchec, BAIL_JOB_MINUTES, LIMITE_LOT_JOBS } from "@/domain/jobs-outbox";
import { db } from "@/infrastructure/db/client";
import { jobsOutbox } from "@/infrastructure/db/schema";
import { logErreur, logInfo } from "@/lib/logger";

export type HandlerJob = (
  payload: Record<string, unknown>,
) => Promise<{ compteurs?: Record<string, number> } | void>;

const handlers = new Map<string, HandlerJob>();

/** Enregistre un handler (idempotent : le dernier gagne). */
export function enregistrerHandlerJob(nom: string, handler: HandlerJob): void {
  handlers.set(nom, handler);
}

const handlersIntegres: Record<string, HandlerJob> = {
  // Debounce de synchronisation fournisseur : la demande durable vit dans
  // `demandes_sync` (révision), ce job n'est que le déclencheur rejouable.
  "fournisseur.sync": async (payload) => {
    const tenantId = typeof payload.tenantId === "string" ? payload.tenantId : "";
    const logementId =
      typeof payload.logementId === "string" ? payload.logementId : "";
    if (!tenantId || !logementId) {
      throw new Error("payload fournisseur.sync incomplet (tenantId, logementId).");
    }
    // Import dynamique : évite le cycle fournisseur-outbox → worker → outbox.
    const { traiterDemandesSync } = await import("./fournisseur-outbox");
    const demandes = await traiterDemandesSync({ tenantId, logementId });
    if (demandes.echecs > 0) {
      throw new Error(
        `${demandes.echecs} échec(s) de synchronisation fournisseur.`,
      );
    }
    // Même repli que l'ancienne minuterie : si la demande n'a rien produit
    // (verrou owner tenu, déjà traitée), un cycle ciblé reste déclenché.
    if (!demandes.ignoree && demandes.ownerDisponible && demandes.total === 0) {
      const { executerCycleFournisseurs } = await import("./fournisseur-sync");
      const cycle = await executerCycleFournisseurs({ tenantId, logementId });
      if (cycle.erreurs > 0) {
        throw new Error(`${cycle.erreurs} erreur(s) du cycle fournisseur.`);
      }
      return { compteurs: { total: cycle.total } };
    }
    return {
      compteurs: {
        total: demandes.total,
        reussies: demandes.reussies,
      },
    };
  },
};

for (const [nom, handler] of Object.entries(handlersIntegres)) {
  handlers.set(nom, handler);
}

export interface ResultatDrain {
  /** Jobs réclamés pendant ce passage. */
  reclames: number;
  reussis: number;
  /** Échecs retentés (remis en attente avec backoff). */
  retentes: number;
  /** Échecs définitifs (`echec`, visibles en supervision). */
  abandonnes: number;
  /** Jobs encore dus après le passage. */
  restants: number;
}

interface LigneReclamee {
  id: string;
  nom: string;
  payload: Record<string, unknown>;
  tentatives: number;
  tentatives_max: number;
}

function messageErreur(erreur: unknown): string {
  const message = erreur instanceof Error ? erreur.message : String(erreur);
  return message.slice(0, 2000);
}

/** Remet en attente les réclamations dont le bail a expiré (worker mort). */
async function reprendreBauxExpires(maintenant: Date): Promise<number> {
  const lignes = await db
    .update(jobsOutbox)
    .set({
      statut: "en_attente",
      verrouilleJusqua: null,
      updatedAt: maintenant,
    })
    .where(
      and(
        eq(jobsOutbox.statut, "en_cours"),
        lte(jobsOutbox.verrouilleJusqua, maintenant),
      ),
    )
    .returning({ id: jobsOutbox.id });
  return lignes.length;
}

/** Réclame atomiquement un lot de jobs dus. */
async function reclamerJobs(
  limite: number,
  maintenant: Date,
): Promise<LigneReclamee[]> {
  const lignes = await db.execute<LigneReclamee>(sql`
    with reclamables as (
      select id
      from jobs_outbox
      where statut = 'en_attente' and disponible_a <= now()
      order by disponible_a, created_at
      limit ${limite}
      for update skip locked
    )
    update jobs_outbox as j
    set statut = 'en_cours',
        verrouille_jusqua = now() + make_interval(mins => ${BAIL_JOB_MINUTES}),
        updated_at = now()
    from reclamables r
    where j.id = r.id
    returning j.id, j.nom, j.payload, j.tentatives, j.tentatives_max
  `);
  return [...lignes] as unknown as LigneReclamee[];
}

/**
 * Traite un lot de jobs dus. Idempotent et réentrant : un second passage ne
 * reprend que ce qui est encore dû. Un handler inconnu échoue la ligne (elle
 * devient visible en `echec`) plutôt que de la faire disparaître en silence.
 */
export async function drainerJobsOutbox(
  options: { limite?: number; maintenant?: Date } = {},
): Promise<ResultatDrain> {
  const maintenant = options.maintenant ?? new Date();
  const limite = Math.max(
    1,
    Math.min(options.limite ?? LIMITE_LOT_JOBS, 100),
  );
  const resultat: ResultatDrain = {
    reclames: 0,
    reussis: 0,
    retentes: 0,
    abandonnes: 0,
    restants: 0,
  };

  try {
    const repris = await reprendreBauxExpires(maintenant);
    if (repris > 0) {
      logInfo("jobs-outbox.baux-repris", { repris });
    }
  } catch (erreur) {
    logErreur("jobs-outbox.reprise-baux", erreur);
    return resultat;
  }

  let lot: LigneReclamee[];
  try {
    lot = await reclamerJobs(limite, maintenant);
  } catch (erreur) {
    logErreur("jobs-outbox.reclamation", erreur);
    return resultat;
  }
  resultat.reclames = lot.length;

  for (const job of lot) {
    const handler = handlers.get(job.nom);
    try {
      if (!handler) {
        throw new Error(`Aucun handler enregistré pour le job « ${job.nom} ».`);
      }
      const issue = await handler(job.payload ?? {});
      await db
        .update(jobsOutbox)
        .set({
          statut: "reussi",
          termineLe: maintenant,
          verrouilleJusqua: null,
          derniereErreur: null,
          updatedAt: maintenant,
        })
        .where(eq(jobsOutbox.id, job.id));
      resultat.reussis += 1;
      if (issue && "compteurs" in issue && issue.compteurs) {
        logInfo("jobs-outbox.reussi", {
          nom: job.nom,
          id: job.id,
          compteurs: issue.compteurs,
        });
      }
    } catch (erreur) {
      const tentativesApres = Number(job.tentatives ?? 0) + 1;
      const suite = apresEchec(
        tentativesApres,
        Number(job.tentatives_max ?? 1),
        maintenant,
      );
      try {
        await db
          .update(jobsOutbox)
          .set({
            statut: suite.statut,
            tentatives: tentativesApres,
            disponibleA: suite.disponibleA,
            verrouilleJusqua: null,
            derniereErreur: messageErreur(erreur),
            termineLe: suite.statut === "echec" ? maintenant : null,
            updatedAt: maintenant,
          })
          .where(eq(jobsOutbox.id, job.id));
      } catch (erreurEcriture) {
        logErreur("jobs-outbox.echec-ecriture", erreurEcriture, {
          nom: job.nom,
          id: job.id,
        });
      }
      if (suite.statut === "echec") {
        resultat.abandonnes += 1;
        logErreur("jobs-outbox.abandonne", erreur, {
          nom: job.nom,
          id: job.id,
          tentatives: tentativesApres,
        });
      } else {
        resultat.retentes += 1;
        logErreur("jobs-outbox.retente", erreur, {
          nom: job.nom,
          id: job.id,
          tentatives: tentativesApres,
        });
      }
    }
  }

  try {
    const dus = await db
      .select({ id: jobsOutbox.id })
      .from(jobsOutbox)
      .where(
        and(
          eq(jobsOutbox.statut, "en_attente"),
          lte(jobsOutbox.disponibleA, maintenant),
        ),
      );
    resultat.restants = dus.length;
  } catch (erreur) {
    logErreur("jobs-outbox.restants", erreur);
  }

  return resultat;
}
