import { json } from "@sveltejs/kit";
import { cronSecretValide } from "@/lib/cron-secret";
import { env } from "@/lib/env";
import { executerCycleIcs } from "@/lib/server/ics-sync";
import { logErreur } from "@/lib/logger";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, url }) => {
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
