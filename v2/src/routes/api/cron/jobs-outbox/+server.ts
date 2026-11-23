/**
 * Spec 006, FR-025 — draine la file de jobs durable.
 *
 * `jobs_outbox` est écrite avant exécution : un redémarrage pendant qu'une
 * file est active ne perd aucun job critique. Ce passage reprend les jobs dus
 * et les baux expirés (worker mort). Idempotent (clé d'idempotence + handlers
 * rejouables côté métier), il est aussi appelé par le planificateur in-process
 * — le verrou système évite le doublon.
 */
import { json } from "@sveltejs/kit";
import { cronSecretValide } from "@/lib/cron-secret";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import { cronAvecJournal } from "@/lib/server/cron-journal";
import { drainerJobsOutbox } from "@/lib/server/outbox-jobs";
import type { RequestHandler } from "@sveltejs/kit";

const handler: RequestHandler = async ({ request }) => {
  if (!env.CRON_SECRET) {
    return json(
      { ok: false, erreur: "CRON_SECRET non configuré." },
      { status: 503 },
    );
  }
  if (!cronSecretValide(request.headers.get("authorization"), env.CRON_SECRET)) {
    return json({ ok: false, erreur: "Non autorisé." }, { status: 401 });
  }

  try {
    const jobs = await drainerJobsOutbox();
    return json({ ok: true, jobs });
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
