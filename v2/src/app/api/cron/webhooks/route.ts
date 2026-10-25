import { createHash, timingSafeEqual } from "node:crypto";
import { connection } from "next/server";
import { LivrerWebhooks } from "@/application/use-cases/livrer-webhooks";
import { creerWebhookHttp } from "@/infrastructure/adapters/webhook-http";
import { DrizzleWebhookRepository } from "@/infrastructure/db/repositories/webhook-repository";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";

function secretValide(header: string | null): boolean {
  const attendu = env.CRON_SECRET;
  if (!attendu) return false;
  const recu = header?.replace(/^Bearer\s+/i, "").trim() ?? "";
  const a = createHash("sha256").update(recu).digest();
  const b = createHash("sha256").update(attendu).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  await connection();

  if (!env.CRON_SECRET) {
    return Response.json(
      { ok: false, erreur: "CRON_SECRET non configuré." },
      { status: 503 },
    );
  }
  if (!secretValide(request.headers.get("authorization"))) {
    return Response.json({ ok: false, erreur: "Non autorisé." }, { status: 401 });
  }

  try {
    const resultat = await new LivrerWebhooks(
      new DrizzleWebhookRepository(),
      creerWebhookHttp(),
    ).executer({ limit: 25 });
    return Response.json({ ok: true, ...resultat });
  } catch (error) {
    logErreur("cronWebhooks", error);
    return Response.json(
      { ok: false, erreur: "Erreur pendant les livraisons." },
      { status: 500 },
    );
  }
}
