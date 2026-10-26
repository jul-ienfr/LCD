import { connection } from "next/server";
import { ImporterIcs } from "@/application/use-cases/importer-ics";
import { SynchroniserFluxIcs } from "@/application/use-cases/synchroniser-flux-ics";
import { SynchroniserTousFluxIcs } from "@/application/use-cases/synchroniser-tous-flux-ics";
import { creerRecuperateurIcs } from "@/infrastructure/adapters/recuperateur-ics";
import { DrizzleBlocageRepository } from "@/infrastructure/db/repositories/blocage-repository";
import { DrizzleFluxIcsRepository } from "@/infrastructure/db/repositories/flux-ics-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { cronSecretValide } from "@/lib/cron-secret";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";

export async function POST(request: Request) {
  await connection();

  if (!env.CRON_SECRET) {
    return Response.json(
      { ok: false, erreur: "CRON_SECRET non configuré." },
      { status: 503 },
    );
  }
  if (
    !cronSecretValide(request.headers.get("authorization"), env.CRON_SECRET)
  ) {
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
