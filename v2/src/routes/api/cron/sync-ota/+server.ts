import { json } from "@sveltejs/kit";
import { cronSecretValide } from "@/lib/cron-secret";
import { env } from "@/lib/env";
import { cronAvecJournal } from "@/lib/server/cron-journal";
import { executerCycleIcs } from "@/lib/server/ics-sync";
import { logErreur } from "@/lib/logger";
import type { RequestHandler } from "@sveltejs/kit";

const handler: RequestHandler = async ({ request, url }) => {
  if (!env.CRON_SECRET) {
    return json({ ok: false, erreur: "CRON_SECRET non configuré." }, { status: 503 });
  }
  if (!cronSecretValide(request.headers.get("authorization"), env.CRON_SECRET)) {
    return json({ ok: false, erreur: "Non autorisé." }, { status: 401 });
  }

  try {
    const resultat = await executerCycleIcs({
      force: url.searchParams.get("force") === "1",
    });
    return json({
      ok: resultat.erreurs === 0,
      verrouille: resultat.verrouille,
      total: resultat.total,
      reussis: resultat.reussis,
      erreurs: resultat.erreurs,
      ignores: resultat.ignores,
      dureeMs: resultat.dureeMs,
      details: resultat.details,
    });
  } catch (error) {
    logErreur("cronSyncOta", error);
    return json(
      { ok: false, erreur: "Erreur pendant la synchronisation." },
      { status: 500 },
    );
  }
};

// Journal d'exécution (spec 006, FR-001). Une erreur de flux ICS n'est pas
// un échec de la tâche : le cycle a tourné, il rapporte ses erreurs.
export const POST = cronAvecJournal("sync-ota", handler);
export const GET = POST;
