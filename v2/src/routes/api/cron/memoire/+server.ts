import { json } from "@sveltejs/kit";
import { db } from "@/infrastructure/db/client";
import { tenants } from "@/infrastructure/db/schema";
import { DrizzleMemoireRepository } from "@/infrastructure/db/repositories/memoire-repository";
import { cronSecretValide } from "@/lib/cron-secret";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  if (!env.CRON_SECRET) {
    return json({ ok: false, erreur: "CRON_SECRET non configuré." }, { status: 503 });
  }
  if (!cronSecretValide(request.headers.get("authorization"), env.CRON_SECRET)) {
    return json({ ok: false, erreur: "Non autorisé." }, { status: 401 });
  }

  try {
    const lignes = await db.select({ id: tenants.id }).from(tenants);
    const repo = new DrizzleMemoireRepository();
    let supprimes = 0;
    for (const tenant of lignes) {
      supprimes += await repo.purgerExpires(tenant.id);
    }
    return json({ ok: true, supprimes });
  } catch (error) {
    logErreur("cronMemoire", error);
    return json({ ok: false, erreur: "Erreur pendant la purge." }, { status: 500 });
  }
};
