import { ImporterIcs } from "@/application/use-cases/importer-ics";
import { SynchroniserFluxIcs } from "@/application/use-cases/synchroniser-flux-ics";
import {
  SynchroniserTousFluxIcs,
  type ResultatSyncGlobal,
} from "@/application/use-cases/synchroniser-tous-flux-ics";
import { creerRecuperateurIcs } from "@/infrastructure/adapters/recuperateur-ics";
import { DrizzleFluxIcsRepository } from "@/infrastructure/db/repositories/flux-ics-repository";
import { DrizzleImportIcsRepository } from "@/infrastructure/db/repositories/import-ics-repository";
import { acquerirVerrouIcs } from "@/infrastructure/db/verrou-systeme";
import { env } from "@/lib/env";
import { logErreur, logInfo } from "@/lib/logger";

export interface ResultatCycleIcs extends ResultatSyncGlobal {
  verrouille: boolean;
  dureeMs: number;
}

const resultatVide = (): ResultatSyncGlobal => ({
  total: 0,
  reussis: 0,
  erreurs: 0,
  ignores: 0,
  details: [],
});

let dernierNettoyage = 0;

export async function executerCycleIcs(options: {
  force?: boolean;
} = {}): Promise<ResultatCycleIcs> {
  const debut = Date.now();

  const verrou = await acquerirVerrouIcs(env.ICS_SYNC_LEASE_MINUTES);
  if (!verrou) {
    return {
      ...resultatVide(),
      verrouille: true,
      dureeMs: Date.now() - debut,
    };
  }

  let verrouPerdu = false;
  const battement = setInterval(
    () => {
      void verrou
        .renouveler()
        .then((renouvele) => {
          if (renouvele || verrouPerdu) return;
          verrouPerdu = true;
          logErreur(
            "ics.sync.bail_perdu",
            new Error("Le bail ICS a expiré et a été repris."),
          );
        })
        .catch((erreur) => {
          logErreur("ics.sync.bail", erreur);
        });
    },
    Math.max(10_000, (env.ICS_SYNC_LEASE_MINUTES * 60_000) / 3),
  );
  battement.unref?.();

  try {
    const flux = new DrizzleFluxIcsRepository();
    const synchroniser = new SynchroniserFluxIcs(
      flux,
      creerRecuperateurIcs({ timeoutMs: env.ICS_SYNC_TIMEOUT_MS }),
      new ImporterIcs(new DrizzleImportIcsRepository()),
    );
    const resultat = await new SynchroniserTousFluxIcs(
      flux,
      synchroniser,
    ).executer({
      force: options.force,
      limite: env.ICS_SYNC_MAX_FLUX_PAR_CYCLE,
      concurrence: env.ICS_SYNC_CONCURRENCE,
      doitArreter: () => verrouPerdu,
    });

    if (resultat.total > 0) {
      logInfo("ics.sync.cycle", {
        total: resultat.total,
        reussis: resultat.reussis,
        erreurs: resultat.erreurs,
        ignores: resultat.ignores,
        dureeMs: Date.now() - debut,
      });
    }

    if (Date.now() - dernierNettoyage > 24 * 60 * 60 * 1_000) {
      try {
        const supprimes = await flux.nettoyerRunsGlobal(30);
        if (supprimes > 0) {
          logInfo("ics.sync.retention", { supprimes });
        }
      } catch (erreur) {
        logErreur("ics.sync.retention", erreur);
      } finally {
        dernierNettoyage = Date.now();
      }
    }

    return {
      ...resultat,
      verrouille: false,
      dureeMs: Date.now() - debut,
    };
  } finally {
    clearInterval(battement);
    await verrou.liberer().catch((erreur) => {
      logErreur("ics.sync.liberation", erreur);
    });
  }
}
