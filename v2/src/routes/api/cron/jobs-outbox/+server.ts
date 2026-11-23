import { json } from "@sveltejs/kit";
import { cronSecretValide } from "@/lib/cron-secret";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import { cronAvecJournal } from "@/lib/server/cron-journal";
import { drainerJobsOutbox } from "@/lib/server/outbox-jobs";
import { reparerTachesIncompletes } from "@/lib/server/journal-execution";
import { purgerRetentionsBornees } from "@/lib/server/retention";
import type { RequestHandler } from "./$types";

/**
 * Spec 006, FR-025 — draine la file de jobs durable.
 *
 * `jobs_outbox` survit au redémarrage : ce passage reprend les jobs dus et les
 * baux expirés. Idempotent (clé unique + handler idempotent côté métier).
 * Il enchaîne aussi les purges de rétention (FR-015/016) : la maintenance vit
 * dans une table de jobs de fait, et ce cron la garde bornée.
 */
const handler: RequestHandler = async ({ request }) => {
  if (!cronSecretValide(request, env.CRON_SECRET)) {
    return json({ ok: false, erreur: "Accès refusé." }, { status: 401 });
  }

  try {
    const tachesReparees = await reparerTachesIncompletes();
    const jobs = await drainerJobsOutbox();
    const retentions = await purgerRetentionsBornees();
    return json({
      ok: retentions.echecs.length === 0,
      tachesReparees,
      jobs,
      retentions,
    });
  } catch (erreur) {
    logErreur("cron.jobs-outbox", erreur);
    return json(
      { ok: false, erreur: "Erreur pendant le drainage de la file de jobs." },
      { status: 500 },
    );
  }
};

export const GET = cronAvecJournal("jobs-outbox", handler);
export const POST = GET;
