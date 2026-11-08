// Simulateur micro-BIC vs réel pour meublé de tourisme. Les seuils et
// abattements sont ceux du barème 2025 ; ils doivent être revérifiés avant
// toute décision. Ce module ne calcule ni l'impôt sur le revenu ni les
// cotisations sociales : il compare uniquement les bases imposables.

import type { RegimeEntite } from "./entite";

export type RegimeSimulable = Extract<
  RegimeEntite,
  "micro_bic_non_classe" | "micro_bic_classe"
>;

export const SEUILS_MICRO_CENTIMES: Record<RegimeSimulable, number> = {
  micro_bic_non_classe: 15_000_00,
  micro_bic_classe: 77_700_00,
};

/** Abattements micro-BIC en points de base : 3000 = 30 %. */
export const ABATTEMENTS_MICRO_BP: Record<RegimeSimulable, number> = {
  micro_bic_non_classe: 3_000,
  micro_bic_classe: 7_100,
};

export const LIBELLES_REGIME_SIMULABLE: Record<RegimeSimulable, string> = {
  micro_bic_non_classe: "Micro-BIC non classé",
  micro_bic_classe: "Micro-BIC classé",
};

export function regimeSimulableValide(
  valeur: string,
): valeur is RegimeSimulable {
  return valeur in SEUILS_MICRO_CENTIMES;
}

export interface SimulationFiscaleInput {
  regime: RegimeSimulable;
  recettesCentimes: number;
  chargesCentimes: number;
  amortissementsCentimes: number;
}

export interface SimulationFiscale {
  regime: RegimeSimulable;
  seuilCentimes: number;
  abattementBp: number;
  recettesCentimes: number;
  chargesDeductiblesCentimes: number;
  amortissementsCentimes: number;
  microPossible: boolean;
  abattementCentimes: number | null;
  baseMicroCentimes: number | null;
  baseReelCentimes: number;
  deficitReportableCentimes: number;
  ecartBaseCentimes: number | null;
  recommandation: "micro" | "reel" | "equivalent" | "micro_indisponible";
}

function montantValide(valeur: number): boolean {
  return Number.isInteger(valeur) && valeur >= 0;
}

export function simulerFiscalite(
  input: SimulationFiscaleInput,
): SimulationFiscale {
  if (
    !montantValide(input.recettesCentimes) ||
    !montantValide(input.chargesCentimes) ||
    !montantValide(input.amortissementsCentimes)
  ) {
    throw new Error("Les montants doivent être des centimes positifs.");
  }

  const seuil = SEUILS_MICRO_CENTIMES[input.regime];
  const microPossible = input.recettesCentimes <= seuil;
  const abattementBp = ABATTEMENTS_MICRO_BP[input.regime];
  const abattementCentimes = microPossible
    ? Math.round((input.recettesCentimes * abattementBp) / 10_000)
    : null;
  const baseMicroCentimes = microPossible
    ? input.recettesCentimes - (abattementCentimes ?? 0)
    : null;

  const chargesTotales =
    input.chargesCentimes + input.amortissementsCentimes;
  const baseReelCentimes = Math.max(
    0,
    input.recettesCentimes - chargesTotales,
  );
  const deficitReportableCentimes = Math.max(
    0,
    chargesTotales - input.recettesCentimes,
  );
  const ecartBaseCentimes =
    baseMicroCentimes === null
      ? null
      : baseMicroCentimes - baseReelCentimes;

  let recommandation: SimulationFiscale["recommandation"];
  if (!microPossible) {
    recommandation = "micro_indisponible";
  } else if (ecartBaseCentimes === 0) {
    recommandation = "equivalent";
  } else if ((ecartBaseCentimes ?? 0) > 0) {
    recommandation = "reel";
  } else {
    recommandation = "micro";
  }

  return {
    regime: input.regime,
    seuilCentimes: seuil,
    abattementBp,
    recettesCentimes: input.recettesCentimes,
    chargesDeductiblesCentimes: input.chargesCentimes,
    amortissementsCentimes: input.amortissementsCentimes,
    microPossible,
    abattementCentimes,
    baseMicroCentimes,
    baseReelCentimes,
    deficitReportableCentimes,
    ecartBaseCentimes,
    recommandation,
  };
}
