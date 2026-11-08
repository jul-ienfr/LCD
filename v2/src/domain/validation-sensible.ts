import { ErreurMetier } from "./erreurs";

export const TYPES_SORTIE_ARGENT = [
  "reversement",
  "remboursement",
  "geste_commercial",
] as const;

export type TypeSortieArgent = (typeof TYPES_SORTIE_ARGENT)[number];

export const TYPES_VALIDATION_SENSIBLE = [
  "caution_retenue",
  ...TYPES_SORTIE_ARGENT,
] as const;

export type TypeValidationSensible =
  (typeof TYPES_VALIDATION_SENSIBLE)[number];

export type StatutValidationSensible =
  | "en_attente"
  | "approuvee"
  | "rejetee"
  | "payee";

export interface ValidationSensible {
  id: string;
  tenantId: string;
  type: TypeValidationSensible;
  cibleId: string;
  ref: string;
  montantCentimes: number;
  payload: Record<string, unknown>;
  demandeurId: string;
  demandeurEmail: string;
  statut: StatutValidationSensible;
  decideurId: string | null;
  decideurEmail: string | null;
  motifDecision: string | null;
  decideLe: Date | null;
  payeeLe: Date | null;
  createdAt: Date;
}

/** Au-delà de 300 €, une retenue de caution exige un second regard. */
export const SEUIL_VALIDATION_CAUTION_CENTIMES = 30_000;

export const SEUIL_SORTIE_ARGENT_CENTIMES = 0;
export const MONTANT_SORTIE_MAX_CENTIMES = 10_000_000;
export const BENEFICIAIRE_MAX = 120;
export const MOTIF_SORTIE_MAX = 500;
export const REFERENCE_SORTIE_MAX = 64;

export function estSortieArgent(
  type: TypeValidationSensible,
): type is TypeSortieArgent {
  return (TYPES_SORTIE_ARGENT as readonly string[]).includes(type);
}

export function validationRequise(
  type: TypeValidationSensible,
  montantCentimes: number,
): boolean {
  if (type === "caution_retenue") {
    return montantCentimes >= SEUIL_VALIDATION_CAUTION_CENTIMES;
  }
  return estSortieArgent(type) && montantCentimes > SEUIL_SORTIE_ARGENT_CENTIMES;
}

export const LIBELLES_STATUT_VALIDATION: Record<
  StatutValidationSensible,
  string
> = {
  en_attente: "En attente",
  approuvee: "Approuvée",
  rejetee: "Rejetée",
  payee: "Payée",
};

export const LIBELLES_TYPE_VALIDATION: Record<TypeValidationSensible, string> = {
  caution_retenue: "Retenue de caution",
  reversement: "Reversement propriétaire",
  remboursement: "Remboursement voyageur",
  geste_commercial: "Geste commercial",
};

export interface SortieArgent {
  type: TypeSortieArgent;
  beneficiaire: string;
  montantCentimes: number;
  motif: string;
  reference: string;
}

export function validerSortieArgent(input: {
  type: string;
  beneficiaire: string;
  montantCentimes: number;
  motif: string;
  reference?: string;
}): SortieArgent {
  if (!estSortieArgent(input.type as TypeValidationSensible)) {
    throw new ErreurMetier(
      "VALIDATION_SENSIBLE_INVALIDE",
      "Le type de sortie est invalide.",
    );
  }
  if (
    !Number.isInteger(input.montantCentimes) ||
    input.montantCentimes <= 0 ||
    input.montantCentimes > MONTANT_SORTIE_MAX_CENTIMES
  ) {
    throw new ErreurMetier(
      "VALIDATION_SENSIBLE_INVALIDE",
      "Le montant doit être un entier strictement positif et plafonné.",
    );
  }
  const beneficiaire = input.beneficiaire.trim();
  if (beneficiaire.length < 2 || beneficiaire.length > BENEFICIAIRE_MAX) {
    throw new ErreurMetier(
      "VALIDATION_SENSIBLE_INVALIDE",
      `Le bénéficiaire doit contenir entre 2 et ${BENEFICIAIRE_MAX} caractères.`,
    );
  }
  const motif = input.motif.trim();
  if (motif.length < 3 || motif.length > MOTIF_SORTIE_MAX) {
    throw new ErreurMetier(
      "VALIDATION_SENSIBLE_INVALIDE",
      `Le motif doit contenir entre 3 et ${MOTIF_SORTIE_MAX} caractères.`,
    );
  }
  const reference = (input.reference ?? "").trim();
  if (reference.length > REFERENCE_SORTIE_MAX) {
    throw new ErreurMetier(
      "VALIDATION_SENSIBLE_INVALIDE",
      `La référence est limitée à ${REFERENCE_SORTIE_MAX} caractères.`,
    );
  }
  return {
    type: input.type as TypeSortieArgent,
    beneficiaire,
    montantCentimes: input.montantCentimes,
    motif,
    reference,
  };
}

export function validationSensibleValide(
  valeur: string,
): valeur is TypeValidationSensible {
  return (TYPES_VALIDATION_SENSIBLE as readonly string[]).includes(valeur);
}
