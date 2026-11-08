import { ErreurMetier } from "@/domain/erreurs";
import {
  codePromoValide,
  normaliserCodePromo,
  type TypePromotion,
} from "@/domain/promotion";
import type { PromotionsRepository } from "../ports/promotions-repository";

export interface CreerPromotionInput {
  tenantId: string;
  code: string;
  type: TypePromotion;
  /** Pourcentage (1-100) ou montant en centimes. */
  valeur: number;
  minNuits?: number | null;
  maxNuits?: number | null;
  minMontantCentimes?: number | null;
  logementId?: string | null;
  debutAt?: Date | null;
  finAt?: Date | null;
  actif?: boolean;
}

/**
 * Cas d'usage : créer un code promotionnel borné (early bird, last minute,
 * séjour long, remise locale). Aucune remise n'est appliquée ici : le calcul
 * reste dans `reserverDirect` via `promotionApplicable`.
 */
export class CreerPromotion {
  constructor(private readonly repo: PromotionsRepository) {}

  async executer(input: CreerPromotionInput) {
    if (!input.tenantId) {
      throw new ErreurMetier("TENANT_INVALIDE", "Tenant requis.");
    }
    const code = normaliserCodePromo(input.code);
    if (!codePromoValide(code)) {
      throw new ErreurMetier(
        "PROMOTION_INVALIDE",
        "Code invalide : 3 à 32 caractères, lettres, chiffres et tirets.",
      );
    }
    if (input.type !== "pourcentage" && input.type !== "montant") {
      throw new ErreurMetier("PROMOTION_INVALIDE", "Type de remise inconnu.");
    }
    if (!Number.isInteger(input.valeur) || input.valeur <= 0) {
      throw new ErreurMetier(
        "PROMOTION_INVALIDE",
        "La remise doit être un entier positif.",
      );
    }
    if (input.type === "pourcentage" && input.valeur > 100) {
      throw new ErreurMetier(
        "PROMOTION_INVALIDE",
        "Une remise en pourcentage ne peut pas dépasser 100 %.",
      );
    }
    const minNuits = input.minNuits ?? null;
    const maxNuits = input.maxNuits ?? null;
    for (const [nom, valeur] of [
      ["minNuits", minNuits],
      ["maxNuits", maxNuits],
    ] as const) {
      if (
        valeur !== null &&
        (!Number.isInteger(valeur) || valeur < 1 || valeur > 60)
      ) {
        throw new ErreurMetier(
          "PROMOTION_INVALIDE",
          `${nom} doit être un entier entre 1 et 60.`,
        );
      }
    }
    if (minNuits !== null && maxNuits !== null && maxNuits < minNuits) {
      throw new ErreurMetier(
        "PROMOTION_INVALIDE",
        "Le nombre de nuits maximum doit dépasser le minimum.",
      );
    }
    if (
      input.minMontantCentimes !== undefined &&
      input.minMontantCentimes !== null &&
      (!Number.isInteger(input.minMontantCentimes) ||
        input.minMontantCentimes < 0)
    ) {
      throw new ErreurMetier(
        "PROMOTION_INVALIDE",
        "Le montant minimum est invalide.",
      );
    }
    const debutAt = input.debutAt ?? null;
    const finAt = input.finAt ?? null;
    if (debutAt && Number.isNaN(debutAt.getTime())) {
      throw new ErreurMetier("PROMOTION_INVALIDE", "Date de début invalide.");
    }
    if (finAt && Number.isNaN(finAt.getTime())) {
      throw new ErreurMetier("PROMOTION_INVALIDE", "Date de fin invalide.");
    }
    if (debutAt && finAt && finAt < debutAt) {
      throw new ErreurMetier(
        "PROMOTION_INVALIDE",
        "La date de fin doit suivre la date de début.",
      );
    }

    return this.repo.creer({
      tenantId: input.tenantId,
      code,
      type: input.type,
      valeur: input.valeur,
      conditions: {
        ...(minNuits !== null ? { minNuits } : {}),
        ...(maxNuits !== null ? { maxNuits } : {}),
        ...(input.minMontantCentimes !== undefined &&
        input.minMontantCentimes !== null
          ? { minMontantCentimes: input.minMontantCentimes }
          : {}),
        ...(input.logementId ? { logementId: input.logementId } : {}),
      },
      logementId: input.logementId ?? null,
      actif: input.actif ?? true,
      debutAt,
      finAt,
    });
  }
}
