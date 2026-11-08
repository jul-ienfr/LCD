import { json } from "@sveltejs/kit";
import { DrizzleFluxIcsRepository } from "@/infrastructure/db/repositories/flux-ics-repository";
import { cronSecretValide } from "@/lib/cron-secret";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request }) => {
  if (!env.CRON_SECRET) {
    return json({ ok: false, erreur: "CRON_SECRET non configuré." }, { status: 503 });
  }
  if (!cronSecretValide(request.headers.get("authorization"), env.CRON_SECRET)) {
    return json({ ok: false, erreur: "Non autorisé." }, { status: 401 });
  }

  try {
    const sante = await new DrizzleFluxIcsRepository().resumeSanteGlobal(
      new Date(),
      10,
    );
    return json({
      ok: sante.enErreur === 0 && sante.enRetard === 0,
      ...sante,
      horodatage: new Date().toISOString(),
    });
  } catch (error) {
    logErreur("ics.sante", error);
    return json({ ok: false, erreur: "Santé ICS indisponible." }, { status: 500 });
  }
};
