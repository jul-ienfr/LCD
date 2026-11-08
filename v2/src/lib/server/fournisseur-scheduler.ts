import { env } from "@/lib/env";
import { logErreur, logInfo } from "@/lib/logger";
import { executerReconciliationFournisseurs } from "./fournisseur-reconciliation";
import { traiterDemandesSync } from "./fournisseur-outbox";
import { executerCycleFournisseurs } from "./fournisseur-sync";

let timer: NodeJS.Timeout | null = null;
let timerReconciliation: NodeJS.Timeout | null = null;
let demarre = false;
let arret = false;
let enCours = false;

function planificateurActif(): boolean {
  const serverless = Boolean(
    process.env.NETLIFY ||
      process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT ||
      process.env.CF_PAGES,
  );
  if (serverless) return false;
  return (
    env.FOURNISSEUR_SYNC_ENABLED === "true" ||
    env.FOURNISSEUR_SYNC_ENABLED === "1"
  );
}

export function demarrerPlanificateurFournisseurs(): void {
  if (demarre) return;
  demarre = true;
  arret = false;

  if (!planificateurActif()) {
    logInfo("fournisseur.scheduler.inactif", {
      raison:
        "FOURNISSEUR_SYNC_ENABLED non activé ou hébergement serverless — utiliser /api/cron/sync-fournisseurs.",
    });
    return;
  }

  logInfo("fournisseur.scheduler.demarre", {
    tickSecondes: env.FOURNISSEUR_SYNC_TICK_SECONDS,
    intervalleMinutes: env.FOURNISSEUR_SYNC_INTERVAL_MINUTES,
    concurrence: env.FOURNISSEUR_SYNC_CONCURRENCE,
  });

  let prochaineExecution = Date.now();
  const boucle = async () => {
    if (arret) return;
    if (!enCours) {
      enCours = true;
      try {
        const demandes = await traiterDemandesSync({ limite: 20 });
        if (demandes.total > 0) {
          logInfo("fournisseur.scheduler.demandes", { ...demandes });
        }
        if (Date.now() >= prochaineExecution) {
          await executerCycleFournisseurs();
          prochaineExecution =
            Date.now() + env.FOURNISSEUR_SYNC_INTERVAL_MINUTES * 60_000;
        }
      } catch (erreur) {
        logErreur("fournisseur.scheduler.cycle", erreur);
      } finally {
        enCours = false;
      }
    }
    if (!arret) {
      timer = setTimeout(boucle, env.FOURNISSEUR_SYNC_TICK_SECONDS * 1_000);
      timer.unref?.();
    }
  };

  timer = setTimeout(boucle, 8_000);
  timer.unref?.();

  // Réconciliation quotidienne, sur un timer séparé pour ne jamais bloquer
  // le cycle de synchronisation. Le verrou de réconciliation évite le doublon
  // avec le cron /api/cron/reconcile-fournisseurs.
  const boucleReconciliation = async () => {
    if (arret) return;
    try {
      const resultat = await executerReconciliationFournisseurs();
      logInfo("fournisseur.scheduler.reconciliation", {
        total: resultat.total,
        avecEcarts: resultat.avecEcarts,
        erreurs: resultat.erreurs,
        verrouille: resultat.verrouille,
      });
    } catch (erreur) {
      logErreur("fournisseur.scheduler.reconciliation", erreur);
    } finally {
      if (!arret) {
        timerReconciliation = setTimeout(
          boucleReconciliation,
          24 * 60 * 60_000,
        );
        timerReconciliation.unref?.();
      }
    }
  };
  timerReconciliation = setTimeout(boucleReconciliation, 10 * 60_000);
  timerReconciliation.unref?.();
}

export function arreterPlanificateurFournisseurs(): void {
  arret = true;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (timerReconciliation) {
    clearTimeout(timerReconciliation);
    timerReconciliation = null;
  }
}

process.once("SIGTERM", arreterPlanificateurFournisseurs);
process.once("SIGINT", arreterPlanificateurFournisseurs);
