import { ErreurMetier } from "./erreurs";

export type TypePromotion = "pourcentage" | "montant";

export interface ConditionsPromotion {
  minNuits?: number;
  maxNuits?: number;
  minMontantCentimes?: number;
  logementId?: string | null;
  debut?: string | null;
  fin?: string | null;
}

export interface Promotion {
  id: string;
  code: string;
  type: TypePromotion;
  valeur: number;
  conditions: ConditionsPromotion;
  actif: boolean;
  debutAt: Date | null;
  finAt: Date | null;
}

export interface ContextePromotion {
  nuits: number;
  montantCentimes: number;
  logementId: string;
  date: string;
}

export function normaliserCodePromo(code: string): string {
  return code.trim().toUpperCase();
}

export function codePromoValide(code: string): boolean {
  return /^[A-Z0-9][A-Z0-9-]{2,31}$/.test(normaliserCodePromo(code));
}

export function promotionApplicable(
  promotion: Promotion,
  contexte: ContextePromotion,
): boolean {
  if (!promotion.actif) return false;
  if (promotion.type !== "pourcentage" && promotion.type !== "montant") {
    return false;
  }
  if (
    !Number.isInteger(promotion.valeur) ||
    promotion.valeur <= 0 ||
    (promotion.type === "pourcentage" && promotion.valeur > 100)
  ) {
    return false;
  }
  if (
    promotion.conditions.logementId &&
    promotion.conditions.logementId !== contexte.logementId
  ) {
    return false;
  }
  if (
    promotion.conditions.minNuits !== undefined &&
    contexte.nuits < promotion.conditions.minNuits
  ) {
    return false;
  }
  if (
    promotion.conditions.maxNuits !== undefined &&
    contexte.nuits > promotion.conditions.maxNuits
  ) {
    return false;
  }
  if (
    promotion.conditions.minMontantCentimes !== undefined &&
    contexte.montantCentimes < promotion.conditions.minMontantCentimes
  ) {
    return false;
  }
  if (promotion.debutAt && contexte.date < isoDate(promotion.debutAt)) {
    return false;
  }
  if (promotion.finAt && contexte.date > isoDate(promotion.finAt)) {
    return false;
  }
  return true;
}

export function calculerRemise(
  promotion: Promotion,
  montantCentimes: number,
): number {
  if (!Number.isInteger(montantCentimes) || montantCentimes < 0) {
    throw new ErreurMetier(
      "PROMOTION_INVALIDE",
      "Le montant à remiser est invalide.",
    );
  }
  if (
    !Number.isInteger(promotion.valeur) ||
    promotion.valeur <= 0 ||
    (promotion.type === "pourcentage" && promotion.valeur > 100)
  ) {
    throw new ErreurMetier(
      "PROMOTION_INVALIDE",
      "Cette promotion n'est pas applicable.",
    );
  }
  const brute =
    promotion.type === "pourcentage"
      ? Math.round((montantCentimes * promotion.valeur) / 100)
      : promotion.valeur;
  return Math.min(montantCentimes, Math.max(0, brute));
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
