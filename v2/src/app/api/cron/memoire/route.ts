import { createHash, timingSafeEqual } from "node:crypto";
import { connection } from "next/server";
import { db } from "@/infrastructure/db/client";
import { tenants } from "@/infrastructure/db/schema";
import { DrizzleMemoireRepository } from "@/infrastructure/db/repositories/memoire-repository";
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
    const repo = new DrizzleMemoireRepository();
    let supprimes = 0;
    for (const tenant of lignes) {
      supprimes += await repo.purgerExpires(tenant.id);
    }
    return Response.json({ ok: true, supprimes });
  } catch (error) {
    logErreur("cronMemoire", error);
    return Response.json(
      { ok: false, erreur: "Erreur pendant la purge." },
      { status: 500 },
    );
  }
}
