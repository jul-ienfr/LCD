import { ImporterReservationsFournisseur } from "@/application/use-cases/importer-reservations-fournisseur";
import {
  SynchroniserFournisseur,
  type StatutSyncFournisseur,
} from "@/application/use-cases/synchroniser-fournisseur";
import type { AffectationFournisseur } from "@/application/ports/fournisseur-repository";
import {
  creerFournisseur,
  fournisseurConfigure,
} from "@/infrastructure/adapters/fournisseurs";
import { DrizzleBlocageRepository } from "@/infrastructure/db/repositories/blocage-repository";
import { DrizzleDemandeSyncRepository } from "@/infrastructure/db/repositories/demande-sync-repository";
import { DrizzleFournisseurRepository } from "@/infrastructure/db/repositories/fournisseur-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePlanTarifaireRepository } from "@/infrastructure/db/repositories/plan-tarifaire-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleRestrictionSejourRepository } from "@/infrastructure/db/repositories/restriction-sejour-repository";
import { DrizzleTarifRepository } from "@/infrastructure/db/repositories/tarif-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { acquerirVerrouSysteme } from "@/infrastructure/db/verrou-systeme";
import { jourParis } from "@/lib/date-paris";
import { env } from "@/lib/env";
import { logErreur, logInfo } from "@/lib/logger";

export interface DetailSyncFournisseur {
  tenantId: string;
  logementId: string;
  fournisseurCode: string;
  statut: StatutSyncFournisseur | "ignore" | "erreur";
  message: string | null;
  crees: number;
  misAJour: number;
  conflits: number;
}

function intervalleMinimumMinutes(
  code: AffectationFournisseur["fournisseurCode"],
): number {
  if (code === "hostport") return env.FOURNISSEUR_HOSTPORT_INTERVAL_MINUTES;
  if (code === "nobeds") return env.FOURNISSEUR_NOBEDS_INTERVAL_MINUTES;
  return 0;
}

export interface ResultatCycleFournisseurs {
  total: number;
  reussis: number;
  erreurs: number;
  ignores: number;
  verrouille: boolean;
  ownerDisponible: boolean;
  dureeMs: number;
  details: DetailSyncFournisseur[];
}

async function parConcurrence<T>(
  elements: readonly T[],
  limite: number,
  traiter: (element: T) => Promise<void>,
  doitArreter: () => boolean,
): Promise<void> {
  let index = 0;
  const workers = Array.from(
    { length: Math.min(Math.max(1, limite), elements.length) },
    async () => {
      while (!doitArreter()) {
        const courant = index;
        index += 1;
        if (courant >= elements.length) return;
        const element = elements[courant];
        if (element !== undefined) await traiter(element);
      }
    },
  );
  await Promise.all(workers);
}

export async function executerCycleFournisseurs(
  options: {
    force?: boolean;
    code?: AffectationFournisseur["fournisseurCode"];
    tenantId?: string;
    logementId?: string;
    maintenant?: string;
    limite?: number;
  } = {},
): Promise<ResultatCycleFournisseurs> {
  const debut = Date.now();
  const verrou = await acquerirVerrouSysteme(
    "fournisseur-sync",
    env.FOURNISSEUR_SYNC_LEASE_MINUTES,
  );
  if (!verrou) {
    return {
      total: 0,
      reussis: 0,
      erreurs: 0,
      ignores: 0,
      verrouille: true,
      ownerDisponible: true,
      dureeMs: Date.now() - debut,
      details: [],
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
            "fournisseur.sync.bail_perdu",
            new Error("Le bail fournisseur a expiré et a été repris."),
          );
        })
        .catch((erreur) => logErreur("fournisseur.sync.bail", erreur));
    },
    Math.max(10_000, (env.FOURNISSEUR_SYNC_LEASE_MINUTES * 60_000) / 3),
  );
  battement.unref?.();

  try {
    const fournisseurs = new DrizzleFournisseurRepository();
    const [activations, affectations] = await Promise.all([
      fournisseurs.listerActivations(),
      fournisseurs.listerAffectationsActives(options.code),
    ]);
    if (affectations === null) {
      return {
        total: 0,
        reussis: 0,
        erreurs: 0,
        ignores: 0,
        verrouille: false,
        ownerDisponible: false,
        dureeMs: Date.now() - debut,
        details: [],
      };
    }

    const actifs = new Set(
      (activations ?? []).filter((a) => a.actif).map((a) => a.code),
    );
    const ciblees = affectations.filter(
      (affectation) =>
        (!options.tenantId || affectation.tenantId === options.tenantId) &&
        (!options.logementId || affectation.logementId === options.logementId),
    );
    const limite = Math.max(
      1,
      Math.min(
        options.limite ?? env.FOURNISSEUR_SYNC_MAX_LOGEMENTS,
        env.FOURNISSEUR_SYNC_MAX_LOGEMENTS,
      ),
    );
    const details: DetailSyncFournisseur[] = [];
    const aTraiter: AffectationFournisseur[] = [];
    for (const affectation of ciblees) {
      const base = {
        tenantId: affectation.tenantId,
        logementId: affectation.logementId,
        fournisseurCode: affectation.fournisseurCode,
      };
      if (!actifs.has(affectation.fournisseurCode)) {
        details.push({
          ...base,
          statut: "ignore",
          message: "Fournisseur désactivé par le super-admin.",
          crees: 0,
          misAJour: 0,
          conflits: 0,
        });
        continue;
      }
      const intervalle = intervalleMinimumMinutes(affectation.fournisseurCode);
      if (
        !options.force &&
        intervalle > 0 &&
        affectation.derniereSync &&
        Date.now() - affectation.derniereSync.getTime() < intervalle * 60_000
      ) {
        details.push({
          ...base,
          statut: "ignore",
          message: `Cycle automatique espacé (${intervalle} min) pour préserver le quota ${affectation.fournisseurCode}.`,
          crees: 0,
          misAJour: 0,
          conflits: 0,
        });
        continue;
      }
      aTraiter.push(affectation);
    }
    const file = aTraiter.slice(0, limite);
    const maintenant = options.maintenant ?? jourParis();

    await parConcurrence(
      file,
      env.FOURNISSEUR_SYNC_CONCURRENCE,
      async (affectation) => {
        const base = {
          tenantId: affectation.tenantId,
          logementId: affectation.logementId,
          fournisseurCode: affectation.fournisseurCode,
        };
        const synchroniser = new SynchroniserFournisseur(
          fournisseurs,
          new DrizzleReservationRepository(),
          new DrizzleBlocageRepository(),
          new DrizzleTarifRepository(),
          new DrizzleRestrictionSejourRepository(),
          new ImporterReservationsFournisseur(
            new DrizzleReservationRepository(),
            new DrizzleBlocageRepository(),
          ),
          (code) =>
            fournisseurConfigure(code) ? creerFournisseur(code) : null,
          new DrizzleLogementRepository(),
          new DrizzlePlanTarifaireRepository(),
          new DrizzleTenantRepository(),
        );

        try {
          const resultat = await synchroniser.executer({
            tenantId: affectation.tenantId,
            logementId: affectation.logementId,
            maintenant,
            horizonJours: env.FOURNISSEUR_SYNC_HORIZON_JOURS,
            joursPasse: env.FOURNISSEUR_SYNC_PAST_DAYS,
            force: options.force,
          });
          details.push({
            ...base,
            statut: resultat.statut,
            message: resultat.message,
            crees: resultat.import.crees,
            misAJour: resultat.import.misAJour,
            conflits: resultat.import.conflits,
          });
        } catch (erreur) {
          logErreur("fournisseur.sync.logement", erreur);
          details.push({
            ...base,
            statut: "erreur",
            message:
              erreur instanceof Error ? erreur.message : "Erreur inconnue.",
            crees: 0,
            misAJour: 0,
            conflits: 0,
          });
        }
      },
      () => verrouPerdu,
    );

    const resultat: ResultatCycleFournisseurs = {
      total: details.length,
      reussis: details.filter(
        (detail) => detail.statut !== "erreur" && detail.statut !== "ignore",
      ).length,
      erreurs: details.filter((detail) => detail.statut === "erreur").length,
      ignores: details.filter((detail) => detail.statut === "ignore").length,
      verrouille: false,
      ownerDisponible: true,
      dureeMs: Date.now() - debut,
      details,
    };

    if (file.length > 0) {
      logInfo("fournisseur.sync.cycle", {
        total: resultat.total,
        reussis: resultat.reussis,
        erreurs: resultat.erreurs,
        ignores: resultat.ignores,
        dureeMs: resultat.dureeMs,
      });
    }
    return resultat;
  } finally {
    clearInterval(battement);
    await verrou.liberer().catch((erreur) => {
      logErreur("fournisseur.sync.liberation", erreur);
    });
  }
}


