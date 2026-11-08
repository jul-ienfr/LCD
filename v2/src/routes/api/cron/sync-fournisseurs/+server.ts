import { json } from "@sveltejs/kit";
import { codeFournisseurValide } from "@/domain/fournisseur";
import { cronSecretValide } from "@/lib/cron-secret";
import { env } from "@/lib/env";
import { traiterDemandesSync } from "@/lib/server/fournisseur-outbox";
import { executerCycleFournisseurs } from "@/lib/server/fournisseur-sync";
import { logErreur } from "@/lib/logger";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, url }) => {
  if (!env.CRON_SECRET) {
    return json(
      { ok: false, erreur: "CRON_SECRET non configuré." },
      { status: 503 },
    );
  }
  if (!cronSecretValide(request.headers.get("authorization"), env.CRON_SECRET)) {
    return json({ ok: false, erreur: "Non autorisé." }, { status: 401 });
  }

  const code = url.searchParams.get("fournisseur");
  if (code && !codeFournisseurValide(code)) {
    return json({ ok: false, erreur: "Fournisseur inconnu." }, { status: 400 });
  }

  try {
    const resultat = await executerCycleFournisseurs({
      force: url.searchParams.get("force") === "1",
      code: code && codeFournisseurValide(code) ? code : undefined,
      limite: Number(url.searchParams.get("limite")) || undefined,
    });
    const demandes = await traiterDemandesSync({ limite: 20 });
    return json(
      {
        ok: resultat.erreurs === 0 && resultat.ownerDisponible,
        ...resultat,
        demandes,
      },
      { status: resultat.ownerDisponible ? 200 : 503 },
    );
  } catch (error) {
    logErreur("cronSyncFournisseurs", error);
    return json(
      { ok: false, erreur: "Erreur pendant la synchronisation fournisseurs." },
      { status: 500 },
    );
  }
};

// Les planificateurs externes utilisent GET ou POST : même handler, même
// vérification du secret.
export const GET = POST;
