import { createHash, timingSafeEqual } from "node:crypto";
import { connection } from "next/server";
import { db } from "@/infrastructure/db/client";
import { tenants } from "@/infrastructure/db/schema";
import { DrizzleFichesPoliceRepository } from "@/infrastructure/db/repositories/fiches-police-repository";
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
    return Response.json(
      { ok: false, erreur: "Non autorisé." },
      { status: 401 },
    );
  }

  try {
    const lignes = await db.select({ id: tenants.id }).from(tenants);
    const repo = new DrizzleFichesPoliceRepository();
    const maintenant = new Date();
    let supprimees = 0;
    for (const tenant of lignes) {
      supprimees += await repo.purgerExpirees(tenant.id, maintenant);
    }
    return Response.json({ ok: true, supprimees });
  } catch (error) {
    logErreur("cronPurgePolice", error);
    return Response.json(
      { ok: false, erreur: "Erreur pendant la purge." },
      { status: 500 },
    );
  }
}
