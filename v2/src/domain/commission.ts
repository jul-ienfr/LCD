// Commission de mandat : pourcentage du CA réservations, en points de base.

import type { Centimes } from "./pricing";

export const COMMISSION_DEFAUT_BP = 2_000; // 20 %
export const COMMISSION_MAX_BP = 5_000; // 50 %

export function commissionBpValide(bp: number): boolean {
  return Number.isInteger(bp) && bp >= 0 && bp <= COMMISSION_MAX_BP;
}

export function montantCommission(
  baseCentimes: Centimes,
  commissionBp: number,
): Centimes {
  if (!Number.isInteger(baseCentimes) || baseCentimes < 0) {
    throw new Error("Base de commission invalide.");
  }
  if (!commissionBpValide(commissionBp)) {
    throw new Error("Taux de commission invalide.");
  }
  return Math.round((baseCentimes * commissionBp) / 10_000);
}

export function netProprietaire(
  baseCentimes: Centimes,
  commissionBp: number,
): Centimes {
  return baseCentimes - montantCommission(baseCentimes, commissionBp);
}

export function formaterCommissionBp(commissionBp: number): string {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(commissionBp / 100)} %`;
}
