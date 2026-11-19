import { json } from "@sveltejs/kit";
import { cronSecretValide } from "@/lib/cron-secret";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import { cronAvecJournal } from "@/lib/server/cron-journal";
import { executerReconciliationFournisseurs } from "@/lib/server/fournisseur-reconciliation";
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
    const resultat = await executerReconciliationFournisseurs();
    if (resultat.verrouille) {
      return json(
        { ok: false, retry: true, ...resultat },
        { status: 503 },
      );
    }
    if (!resultat.ownerDisponible) {
      return json(
        {
          ok: false,
          erreur: "Connexion owner indisponible.",
          ...resultat,
        },
        { status: 503 },
      );
    }
    const ok = resultat.avecEcarts === 0 && resultat.erreurs === 0;
    return json(
      { ok, ...resultat },
      { status: ok ? 200 : 503 },
    );
  } catch (error) {
    logErreur("cronReconcileFournisseurs", error);
    return json(
      { ok: false, erreur: "Erreur pendant la réconciliation." },
      { status: 500 },
    );
  }
};

// Les planificateurs externes utilisent GET ou POST : même handler, même
// vérification du secret. Le 503 « verrou tenu » est une exécution normale
// (le travail se fait ailleurs) ; les écarts, eux, ne sont pas un échec de
// la tâche de réconciliation elle-même.
export const GET = cronAvecJournal("reconcile-fournisseurs", handler, {
  statutsIgnores: [503],
  statutsSucces: [503],
});
export const POST = GET;
