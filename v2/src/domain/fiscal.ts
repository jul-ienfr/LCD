// Paramètres fiscaux d'un tenant : purs, testables sans base.
// Tous les montants restent en centimes entiers.

import type { Centimes } from "./pricing";
import type { TenantId } from "./tenant";

export interface ParametresFiscaux {
  tenantId: TenantId;
  /** Taux de TVA en points de base : 1000 = 10 %. */
  tauxTvaBp: number;
  /** Taxe de séjour par nuit et par personne, en centimes. */
  taxeSejourNuitPersonneCentimes: Centimes;
  /** Plafond par nuit et par personne, ou null si aucun plafond. */
  taxeSejourPlafondCentimes: Centimes | null;
  prefixeFacture: string;
  mentionsLegales: string | null;
}

export const PARAMETRES_FISCAUX_DEFAUT: Omit<ParametresFiscaux, "tenantId"> = {
  tauxTvaBp: 1_000,
  taxeSejourNuitPersonneCentimes: 0,
  taxeSejourPlafondCentimes: null,
  prefixeFacture: "FAC",
  mentionsLegales: null,
};

export function parametresFiscauxParDefaut(
  tenantId: TenantId,
): ParametresFiscaux {
  return { tenantId, ...PARAMETRES_FISCAUX_DEFAUT };
}

export function tauxTvaValide(tauxTvaBp: number): boolean {
  return (
    Number.isInteger(tauxTvaBp) && tauxTvaBp >= 0 && tauxTvaBp <= 10_000
  );
}

export function prefixeFactureValide(prefixe: string): boolean {
  return /^[A-Z0-9]{2,8}$/.test(prefixe);
}

/** TVA calculée depuis un montant HT et un taux en points de base. */
export function montantTva(
  htCentimes: Centimes,
  tauxTvaBp: number,
): Centimes {
  if (!Number.isInteger(htCentimes) || htCentimes < 0) {
    throw new Error("Montant HT invalide.");
  }
  if (!tauxTvaValide(tauxTvaBp)) {
    throw new Error("Taux de TVA invalide.");
  }
  return Math.round((htCentimes * tauxTvaBp) / 10_000);
}

/**
 * Taxe de séjour : tarif par nuit et par personne, plafonné si nécessaire.
 * La taxe est due pour chaque nuit et chaque voyageur.
 */
export function montantTaxeSejour(input: {
  nuits: number;
  voyageurs: number;
  taxeSejourNuitPersonneCentimes: Centimes;
  taxeSejourPlafondCentimes?: Centimes | null;
}): Centimes {
  if (!Number.isInteger(input.nuits) || input.nuits < 0) {
    throw new Error("Nombre de nuits invalide.");
  }
  if (!Number.isInteger(input.voyageurs) || input.voyageurs < 0) {
    throw new Error("Nombre de voyageurs invalide.");
  }
  if (
    !Number.isInteger(input.taxeSejourNuitPersonneCentimes) ||
    input.taxeSejourNuitPersonneCentimes < 0
  ) {
    throw new Error("Taxe de séjour invalide.");
  }
  if (
    input.taxeSejourPlafondCentimes != null &&
    (!Number.isInteger(input.taxeSejourPlafondCentimes) ||
      input.taxeSejourPlafondCentimes < 0)
  ) {
    throw new Error("Plafond de taxe de séjour invalide.");
  }

  const parNuitPersonne =
    input.taxeSejourPlafondCentimes != null
      ? Math.min(
          input.taxeSejourNuitPersonneCentimes,
          input.taxeSejourPlafondCentimes,
        )
      : input.taxeSejourNuitPersonneCentimes;

  return parNuitPersonne * input.nuits * input.voyageurs;
}

/** Formate un taux de points de base pour l'affichage (10 %, 5,5 %). */
export function formaterTauxTva(tauxTvaBp: number): string {
  const pourcentage = tauxTvaBp / 100;
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(pourcentage)} %`;
}
