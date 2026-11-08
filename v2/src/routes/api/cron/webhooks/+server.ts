import { json } from "@sveltejs/kit";
import { LivrerWebhooks } from "@/application/use-cases/livrer-webhooks";
import { creerWebhookHttp } from "@/infrastructure/adapters/webhook-http";
import { DrizzleWebhookRepository } from "@/infrastructure/db/repositories/webhook-repository";
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
    const resultat = await new LivrerWebhooks(
      new DrizzleWebhookRepository(),
      creerWebhookHttp(),
    ).executer({ limit: 25 });
    return json({ ok: true, ...resultat });
  } catch (error) {
    logErreur("cronWebhooks", error);
    return json({ ok: false, erreur: "Erreur pendant les livraisons." }, { status: 500 });
  }
};
