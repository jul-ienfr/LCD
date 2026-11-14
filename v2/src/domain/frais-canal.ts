/**
 * T129 — Frais par canal et mapping des politiques d'annulation.
 *
 * Domaine pur : aucune dépendance SvelteKit, Drizzle ou externe.
 *
 * Deux responsabilités :
 * 1. Frais par canal (animaux, ménage, service) : structure, validation,
 *    calcul. Ces frais s'ajoutent au montant du séjour selon le canal de
 *    provenance de la réservation.
 * 2. Mapping des politiques d'annulation OTA (flexible, moderate, strict,
 *    non remboursable) vers la structure interne `PolitiqueAnnulation`
 *    (paliers + frais fixes) définie dans `echeancier.ts`.
 */

import type { CodeCanal } from "./canal";
import type { PolitiqueAnnulation } from "./echeancier";

// --- Frais par canal ---

export const TYPES_FRAIS_CANAL = ["animaux", "menage", "service"] as const;

export type TypeFraisCanal = (typeof TYPES_FRAIS_CANAL)[number];

export type ModeCalculFrais = "fixe" | "pourcentage" | "par_nuit";

export interface FraisCanal {
  /** Canal concerné (airbnb, booking, etc.) ou null = tous les canaux. */
  canal: CodeCanal | null;
  type: TypeFraisCanal;
  mode: ModeCalculFrais;
  /** Montant en centimes (fixe/par_nuit) ou pourcentage (0-100). */
  valeur: number;
  /** Libellé affiché au voyageur. */
  libelle: string;
  actif: boolean;
}

export const FRAIS_MAX_CENTIMES = 10_000_00; // 10 000 €
export const POURCENTAGE_MAX = 30;
export const NUITS_MAX_CALCUL = 365;

/**
 * Valide la configuration d'un frais canal.
 * - fixe / par_nuit : valeur en centimes, 0 à FRAIS_MAX_CENTIMES
 * - pourcentage : valeur entre 0 et POURCENTAGE_MAX
 */
export function fraisCanalValide(frais: {
  type: string;
  mode: string;
  valeur: number;
  libelle?: string;
}): boolean {
  if (!TYPES_FRAIS_CANAL.includes(frais.type as TypeFraisCanal)) return false;
  if (!["fixe", "pourcentage", "par_nuit"].includes(frais.mode)) return false;
  if (!Number.isFinite(frais.valeur) || frais.valeur < 0) return false;
  if (frais.mode === "pourcentage") {
    if (frais.valeur > POURCENTAGE_MAX) return false;
  } else {
    if (!Number.isInteger(frais.valeur)) return false;
    if (frais.valeur > FRAIS_MAX_CENTIMES) return false;
  }
  if (frais.libelle !== undefined && frais.libelle.length > 200) return false;
  return true;
}

/**
 * Calcule le montant total d'un frais pour un séjour donné.
 *
 * @param frais - Configuration du frais
 * @param baseCentimes - Montant du séjour (pour le mode pourcentage)
 * @param nuits - Nombre de nuits (pour le mode par_nuit)
 * @returns Montant du frais en centimes (arrondi à l'entier)
 */
export function calculerFraisCanal(
  frais: FraisCanal,
  baseCentimes: number,
  nuits: number,
): number {
  if (!frais.actif) return 0;
  switch (frais.mode) {
    case "fixe":
      return Math.round(frais.valeur);
    case "par_nuit": {
      const nuitsEffectives = Math.max(
        0,
        Math.min(nuits, NUITS_MAX_CALCUL),
      );
      return Math.round(frais.valeur * nuitsEffectives);
    }
    case "pourcentage": {
      const base = Math.max(0, baseCentimes);
      return Math.round((base * frais.valeur) / 100);
    }
  }
}

/**
 * Calcule le total de tous les frais actifs applicables à un canal donné
 * pour un séjour. Les frais avec `canal: null` s'appliquent à tous les canaux.
 */
export function calculerTotalFraisCanal(
  fraisListe: readonly FraisCanal[],
  canal: CodeCanal | null,
  baseCentimes: number,
  nuits: number,
): { totalCentimes: number; detail: { type: TypeFraisCanal; montantCentimes: number }[] } {
  const applicables = fraisListe.filter(
    (f) => f.actif && (f.canal === null || f.canal === canal),
  );
  const detail: { type: TypeFraisCanal; montantCentimes: number }[] = [];
  let totalCentimes = 0;
  for (const frais of applicables) {
    const montant = calculerFraisCanal(frais, baseCentimes, nuits);
    if (montant > 0) {
      detail.push({ type: frais.type, montantCentimes: montant });
      totalCentimes += montant;
    }
  }
  return { totalCentimes, detail };
}

// --- Politiques d'annulation par canal ---

export const CODES_POLITIQUE_ANNULATION = [
  "flexible",
  "moderate",
  "strict",
  "non_remboursable",
] as const;

export type CodePolitiqueAnnulation = (typeof CODES_POLITIQUE_ANNULATION)[number];

/**
 * Politiques d'annulation standardisées, inspirées des pratiques OTA.
 * Chaque code mappe vers une `PolitiqueAnnulation` interne (paliers).
 *
 * - flexible : 100 % jusqu'à 5 jours, 50 % de 5 à 1 jour, 0 % ensuite
 * - moderate : 100 % jusqu'à 14 jours, 50 % de 14 à 7 jours, 0 % ensuite
 * - strict : 50 % jusqu'à 30 jours, 25 % de 30 à 14 jours, 0 % ensuite
 * - non_remboursable : 0 % toujours
 */
export const POLITIQUES_ANNULATION: Record<CodePolitiqueAnnulation, PolitiqueAnnulation> = {
  flexible: {
    paliers: [
      { joursAvantMin: 5, pourcentageRembourse: 100 },
      { joursAvantMin: 1, pourcentageRembourse: 50 },
      { joursAvantMin: 0, pourcentageRembourse: 0 },
    ],
  },
  moderate: {
    paliers: [
      { joursAvantMin: 14, pourcentageRembourse: 100 },
      { joursAvantMin: 7, pourcentageRembourse: 50 },
      { joursAvantMin: 0, pourcentageRembourse: 0 },
    ],
  },
  strict: {
    paliers: [
      { joursAvantMin: 30, pourcentageRembourse: 50 },
      { joursAvantMin: 14, pourcentageRembourse: 25 },
      { joursAvantMin: 0, pourcentageRembourse: 0 },
    ],
  },
  non_remboursable: {
    paliers: [{ joursAvantMin: 0, pourcentageRembourse: 0 }],
  },
};

/**
 * Politique d'annulation par défaut selon le canal de provenance.
 * Les OTA imposent généralement leur propre politique ; en direct, le
 * propriétaire choisit. Ce mapping sert de repli quand la réservation
 * externe ne porte pas d'information de politique.
 */
export const POLITIQUE_PAR_DEFAUT_CANAL: Record<string, CodePolitiqueAnnulation> = {
  airbnb: "moderate",
  booking: "flexible",
  abritel: "strict",
  agoda: "moderate",
  trip: "moderate",
  "gites-de-france": "strict",
  clevacances: "moderate",
  leboncoin: "flexible",
  pitchup: "flexible",
  hipcamp: "flexible",
  generique: "moderate",
};

/**
 * Retourne la PolitiqueAnnulation pour un code de politique donné.
 * Si le code est inconnu, retourne la politique moderate par défaut.
 */
export function politiqueAnnulationPourCode(
  code: string,
): PolitiqueAnnulation {
  if (CODES_POLITIQUE_ANNULATION.includes(code as CodePolitiqueAnnulation)) {
    return POLITIQUES_ANNULATION[code as CodePolitiqueAnnulation];
  }
  return POLITIQUES_ANNULATION.moderate;
}

/**
 * Résout la politique d'annulation applicable pour une réservation selon
 * son canal source. Priorité :
 * 1. Politique explicitement fournie (ex : choisie par le propriétaire)
 * 2. Politique par défaut du canal
 * 3. Moderate (repli sûr)
 */
export function resoudrePolitiqueAnnulation(input: {
  canal: CodeCanal | null;
  politiqueExplicite?: PolitiqueAnnulation | null;
}): PolitiqueAnnulation {
  if (input.politiqueExplicite && input.politiqueExplicite.paliers.length > 0) {
    return input.politiqueExplicite;
  }
  const codeDefaut = input.canal ? POLITIQUE_PAR_DEFAUT_CANAL[input.canal] : undefined;
  if (codeDefaut) {
    return politiqueAnnulationPourCode(codeDefaut);
  }
  return POLITIQUES_ANNULATION.moderate;
}

/**
 * Valide qu'un code de politique est reconnu.
 */
export function codePolitiqueAnnulationValide(
  code: string,
): code is CodePolitiqueAnnulation {
  return (CODES_POLITIQUE_ANNULATION as readonly string[]).includes(code);
}
