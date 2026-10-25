import { createHash, timingSafeEqual } from "node:crypto";
import { connection } from "next/server";
import { ImporterIcs } from "@/application/use-cases/importer-ics";
import { SynchroniserFluxIcs } from "@/application/use-cases/synchroniser-flux-ics";
import { SynchroniserTousFluxIcs } from "@/application/use-cases/synchroniser-tous-flux-ics";
import { creerRecuperateurIcs } from "@/infrastructure/adapters/recuperateur-ics";
import { DrizzleBlocageRepository } from "@/infrastructure/db/repositories/blocage-repository";
import { DrizzleFluxIcsRepository } from "@/infrastructure/db/repositories/flux-ics-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
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
    const resultat = await new SynchroniserTousFluxIcs(
      new DrizzleFluxIcsRepository(),
      new SynchroniserFluxIcs(
        new DrizzleFluxIcsRepository(),
        creerRecuperateurIcs(),
        new ImporterIcs(
          new DrizzleReservationRepository(),
          new DrizzleBlocageRepository(),
        ),
      ),
    ).executer();

    return Response.json({ ok: true, ...resultat });
  } catch (error) {
    logErreur("cronSyncOta", error);
    return Response.json(
      { ok: false, erreur: "Erreur pendant la synchronisation." },
      { status: 500 },
    );
  }
}
