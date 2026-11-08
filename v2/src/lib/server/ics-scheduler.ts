import { env } from "@/lib/env";
import { logErreur, logInfo } from "@/lib/logger";
import { executerCycleIcs } from "./ics-sync";

let timer: NodeJS.Timeout | null = null;
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
    env.ICS_SCHEDULER_ENABLED === "true" ||
    env.ICS_SCHEDULER_ENABLED === "1"
  );
}

export function demarrerPlanificateurIcs(): void {
  if (demarre) return;
  demarre = true;
  arret = false;

  if (!planificateurActif()) {
    logInfo("ics.scheduler.inactif", {
      raison:
        "ICS_SCHEDULER_ENABLED non activé ou hébergement serverless — utiliser /api/cron/sync-ota.",
    });
    return;
  }

  logInfo("ics.scheduler.demarre", {
    tickSecondes: env.ICS_SYNC_TICK_SECONDS,
    intervalleMinutes: env.ICS_SYNC_INTERVAL_MINUTES,
    concurrence: env.ICS_SYNC_CONCURRENCE,
  });

  const boucle = async () => {
    if (arret) return;
    if (!enCours) {
      enCours = true;
      try {
        await executerCycleIcs();
      } catch (erreur) {
        logErreur("ics.scheduler.cycle", erreur);
      } finally {
        enCours = false;
      }
    }
    if (!arret) {
      timer = setTimeout(boucle, env.ICS_SYNC_TICK_SECONDS * 1_000);
      timer.unref?.();
    }
  };

  timer = setTimeout(boucle, 5_000);
  timer.unref?.();
}

export function arreterPlanificateurIcs(): void {
  arret = true;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

process.once("SIGTERM", arreterPlanificateurIcs);
process.once("SIGINT", arreterPlanificateurIcs);
