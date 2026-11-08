import { ajouterJours } from "@/domain/calendrier";
import { ReconcilierCanal } from "@/application/use-cases/reconcilier-canal";
import { DrizzleFournisseurRepository } from "@/infrastructure/db/repositories/fournisseur-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import {
  creerFournisseur,
  fournisseurConfigure,
} from "@/infrastructure/adapters/fournisseurs";
import { acquerirVerrouSysteme } from "@/infrastructure/db/verrou-systeme";
import { jourParis } from "@/lib/date-paris";
import { env } from "@/lib/env";
import { logErreur, logInfo } from "@/lib/logger";

export interface DetailReconciliationFournisseur {
  tenantId: string;
  logementId: string;
  fournisseurCode: string;
  statut: "ok" | "ecarts" | "erreur";
  message: string | null;
  manquantes: number;
  orphelines: number;
  dates: number;
  statuts: number;
}

export interface ResultatReconciliationFournisseurs {
  total: number;
  reussis: number;
  avecEcarts: number;
  erreurs: number;
  verrouille: boolean;
  ownerDisponible: boolean;
  dureeMs: number;
  details: DetailReconciliationFournisseur[];
}

/**
 * Réconciliation de sécurité, en lecture seule : compare les réservations
 * connues du fournisseur à celles de la base. N'écrit rien ; alerte via le
 * rapport et le cron.
 */
export async function executerReconciliationFournisseurs(
  options: {
    depuis?: string;
    jusqua?: string;
    tenantId?: string;
    logementId?: string;
    limite?: number;
  } = {},
): Promise<ResultatReconciliationFournisseurs> {
  const debut = Date.now();
  const verrou = await acquerirVerrouSysteme(
    "fournisseur-reconciliation",
    Math.max(5, env.FOURNISSEUR_SYNC_LEASE_MINUTES),
  );
  if (!verrou) {
    return {
      total: 0,
      reussis: 0,
      avecEcarts: 0,
      erreurs: 0,
      verrouille: true,
      ownerDisponible: true,
      dureeMs: Date.now() - debut,
      details: [],
    };
  }

  try {
    const repo = new DrizzleFournisseurRepository();
    const affectations = await repo.listerAffectationsActives();
    if (affectations === null) {
      return {
        total: 0,
        reussis: 0,
        avecEcarts: 0,
        erreurs: 0,
        verrouille: false,
        ownerDisponible: false,
        dureeMs: Date.now() - debut,
        details: [],
      };
    }

    const maintenant = jourParis();
    const depuis =
      options.depuis ??
      ajouterJours(maintenant, -Math.max(1, env.FOURNISSEUR_SYNC_PAST_DAYS));
    const jusqua =
      options.jusqua ??
      ajouterJours(maintenant, Math.max(1, env.FOURNISSEUR_SYNC_HORIZON_JOURS));
    const ciblees = affectations
      .filter(
        (affectation) =>
          (!options.tenantId || affectation.tenantId === options.tenantId) &&
          (!options.logementId ||
            affectation.logementId === options.logementId),
      )
      .slice(
        0,
        Math.max(
          1,
          Math.min(
            options.limite ?? env.FOURNISSEUR_SYNC_MAX_LOGEMENTS,
            env.FOURNISSEUR_SYNC_MAX_LOGEMENTS,
          ),
        ),
      );

    const details: DetailReconciliationFournisseur[] = [];
    for (const affectation of ciblees) {
      const base = {
        tenantId: affectation.tenantId,
        logementId: affectation.logementId,
        fournisseurCode: affectation.fournisseurCode,
      };
      try {
        const reconcilier = new ReconcilierCanal(
          repo,
          new DrizzleReservationRepository(),
          (code) =>
            fournisseurConfigure(code) ? creerFournisseur(code) : null,
        );
        const resultat = await reconcilier.executer({
          tenantId: affectation.tenantId,
          logementId: affectation.logementId,
          depuis,
          jusqua,
        });
        const aDesEcarts = resultat.ecarts.length > 0;
        details.push({
          ...base,
          statut: aDesEcarts ? "ecarts" : "ok",
          message: aDesEcarts
            ? `${resultat.ecarts.length} écart(s) de réconciliation.`
            : null,
          manquantes: resultat.manquantes,
          orphelines: resultat.orphelines,
          dates: resultat.dates,
          statuts: resultat.statuts,
        });
      } catch (erreur) {
        logErreur("fournisseur.reconciliation.logement", erreur);
        details.push({
          ...base,
          statut: "erreur",
          message:
            erreur instanceof Error ? erreur.message : "Erreur inconnue.",
          manquantes: 0,
          orphelines: 0,
          dates: 0,
          statuts: 0,
        });
      }
    }

    const resultat: ResultatReconciliationFournisseurs = {
      total: details.length,
      reussis: details.filter((detail) => detail.statut === "ok").length,
      avecEcarts: details.filter((detail) => detail.statut === "ecarts").length,
      erreurs: details.filter((detail) => detail.statut === "erreur").length,
      verrouille: false,
      ownerDisponible: true,
      dureeMs: Date.now() - debut,
      details,
    };

    if (resultat.total > 0) {
      logInfo("fournisseur.reconciliation.cycle", {
        total: resultat.total,
        reussis: resultat.reussis,
        avecEcarts: resultat.avecEcarts,
        erreurs: resultat.erreurs,
        dureeMs: resultat.dureeMs,
      });
    }
    return resultat;
  } finally {
    await verrou.liberer().catch((erreur) => {
      logErreur("fournisseur.reconciliation.liberation", erreur);
    });
  }
}
