import { TraiterDemandesSync } from "@/application/use-cases/traiter-demandes-sync";
import { QueueOutbox } from "@/infrastructure/adapters/queue-outbox";
import { DrizzleDemandeSyncRepository } from "@/infrastructure/db/repositories/demande-sync-repository";
import { logErreur, logInfo } from "@/lib/logger";
import { executerCycleFournisseurs } from "./fournisseur-sync";
import { drainerJobsOutbox } from "./outbox-jobs";

export async function traiterDemandesSync(
  options: {
    tenantId?: string;
    logementId?: string;
    limite?: number;
  } = {},
) {
  const traiteur = new TraiterDemandesSync(
    new DrizzleDemandeSyncRepository(),
    async (cible) => {
      const resultat = await executerCycleFournisseurs(cible);
      return {
        total: resultat.total,
        erreurs: resultat.erreurs,
        verrouille: resultat.verrouille,
        ownerDisponible: resultat.ownerDisponible,
        details: resultat.details.map((detail) => ({
          statut: detail.statut,
          message: detail.message,
        })),
      };
    },
  );
  try {
    const resultat = await traiteur.executer(options);
    if (resultat.total > 0) {
      logInfo("fournisseur.demandes.traitees", { ...resultat });
    }
    return resultat;
  } catch (erreur) {
    logErreur("fournisseur.demandes.traitement", erreur);
    return {
      total: 0,
      reussies: 0,
      echecs: 1,
      ownerDisponible: true,
      ignoree: false,
    };
  }
}

/**
 * Debounce durable (FR-025). La demande est écrite dans `demandes_sync`
 * (source de vérité, révisée) et un job idempotent est posé dans
 * `jobs_outbox`. La minuterie ne fait qu'avancer la latence : si le processus
 * redémarre, le job reste dû et le planificateur ou le cron le reprend.
 */
const queue = new QueueOutbox();

export function planifierSyncFournisseur(
  tenantId: string,
  logementId: string,
  delaiMs = 1_500,
): void {
  const delai = Math.max(0, delaiMs);
  void new DrizzleDemandeSyncRepository()
    .enregistrer(tenantId, logementId)
    .then(() =>
      queue.enqueue(
        "fournisseur.sync",
        { tenantId, logementId },
        {
          idempotencyKey: `fournisseur.sync:${tenantId}:${logementId}`,
          runAt: new Date(Date.now() + delai),
        },
      ),
    )
    .then(() => {
      const timer = setTimeout(() => {
        void drainerJobsOutbox({ limite: 5 }).catch((erreur) => {
          logErreur("fournisseur.outbox.drain", erreur);
        });
      }, delai + 50);
      timer.unref?.();
    })
    .catch((erreur) => {
      logErreur("fournisseur.demande.enregistrement", erreur);
    });
}
