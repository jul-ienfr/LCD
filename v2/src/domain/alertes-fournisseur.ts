import type { LogementAvecFournisseur } from "@/application/ports/fournisseur-repository";
import type { CodeFournisseur } from "@/domain/fournisseur";
import type { SanteSync } from "@/domain/sante-fournisseur";

export type SeveriteAlerteFournisseur = "danger" | "alerte";

export interface AlerteFournisseur {
  id: string;
  severite: SeveriteAlerteFournisseur;
  tenantNom: string;
  logementNom: string;
  logementId: string;
  fournisseurCode: CodeFournisseur;
  message: string;
  ageMinutes: number | null;
}

const SEUIL_RETARD_MINUTES = 15;

type LogementAvecSante = LogementAvecFournisseur & {
  sante: SanteSync | null;
};

/**
 * Transforme la santé fournisseur en alertes lisibles.
 * Règles : pause automatique du disjoncteur = danger (reprise manuelle
 * requise, FR-023), erreur = danger, jamais synchronisé = alerte, dernier
 * pull > 15 min = alerte. Les états `ok` et `partiel` ne produisent pas de
 * notification.
 */
export function construireAlertesFournisseurs(
  logements: readonly LogementAvecSante[],
): AlerteFournisseur[] {
  const alertes: AlerteFournisseur[] = [];

  for (const logement of logements) {
    if (!logement.fournisseurCode) continue;
    const base = {
      id: `${logement.tenantId}:${logement.logementId}`,
      tenantNom: logement.tenantNom,
      logementNom: logement.logementNom,
      logementId: logement.logementId,
      fournisseurCode: logement.fournisseurCode,
      ageMinutes: logement.sante?.ageMinutes ?? null,
    };

    // Une pause automatique sort la ligne des affectations actives : la
    // santé n'est plus calculée, seul le disjoncteur explique l'état.
    if (logement.disjoncteurOuvertLe) {
      alertes.push({
        ...base,
        severite: "danger",
        message:
          `Mise en pause automatique (disjoncteur) après ${logement.echecsConsecutifs ?? 0} échecs consécutifs — reprise manuelle requise.`,
      });
      continue;
    }
    if (!logement.sante) continue;
    const { etat, ageMinutes } = logement.sante;

    if (etat === "erreur") {
      alertes.push({
        ...base,
        severite: "danger",
        message: "Dernière synchronisation en erreur.",
      });
      continue;
    }
    if (etat === "jamais") {
      alertes.push({
        ...base,
        severite: "alerte",
        message: "Aucune synchronisation enregistrée.",
      });
      continue;
    }
    if (
      etat === "retard" &&
      ageMinutes !== null &&
      ageMinutes > SEUIL_RETARD_MINUTES
    ) {
      alertes.push({
        ...base,
        severite: "alerte",
        message: `Dernier pull il y a ${ageMinutes} min (seuil ${SEUIL_RETARD_MINUTES} min).`,
      });
    }
  }

  return alertes.sort((a, b) => {
    if (a.severite !== b.severite) return a.severite === "danger" ? -1 : 1;
    return (b.ageMinutes ?? 0) - (a.ageMinutes ?? 0);
  });
}
