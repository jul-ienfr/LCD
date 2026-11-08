import { TraiterDemandesSync } from "@/application/use-cases/traiter-demandes-sync";
import { DrizzleDemandeSyncRepository } from "@/infrastructure/db/repositories/demande-sync-repository";
import { logErreur, logInfo } from "@/lib/logger";
import { executerCycleFournisseurs } from "./fournisseur-sync";
import { PlanificateurSync } from "./planificateur-sync";

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

const planificateur = new PlanificateurSync(async ({ tenantId, logementId }) => {
  try {
    const demandes = await traiterDemandesSync({ tenantId, logementId });
    if (
      demandes.ignoree ||
      !demandes.ownerDisponible ||
      demandes.total > 0
    ) {
      return { total: demandes.total, erreurs: demandes.echecs };
    }

    const resultat = await executerCycleFournisseurs({
      tenantId,
      logementId,
    });
    if (resultat.total > 0) {
      logInfo("fournisseur.sync.declenche", {
        tenantId,
        logementId,
        total: resultat.total,
        erreurs: resultat.erreurs,
      });
    }
    return { total: resultat.total, erreurs: resultat.erreurs };
  } catch (erreur) {
    logErreur("fournisseur.sync.declenche", erreur);
    return { total: 0, erreurs: 1 };
  }
});

export function planifierSyncFournisseur(
  tenantId: string,
  logementId: string,
  delaiMs?: number,
): void {
  void new DrizzleDemandeSyncRepository()
    .enregistrer(tenantId, logementId)
    .catch((erreur) => {
      logErreur("fournisseur.demande.enregistrement", erreur);
    })
    .finally(() => {
      planificateur.planifier(tenantId, logementId, delaiMs);
    });
}
