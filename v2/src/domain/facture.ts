import type { Centimes } from "./pricing";

export type FactureId = string;
export type StatutFacture = "brouillon" | "emise" | "payee" | "annulee";

export const TRANSITIONS_FACTURE: Record<StatutFacture, StatutFacture[]> = {
  brouillon: ["emise", "annulee"],
  emise: ["payee", "annulee"],
  payee: [],
  annulee: [],
};

export interface FactureLigne {
  id?: string;
  designation: string;
  quantite: number;
  prixUnitaireCentimes: Centimes;
  totalCentimes: Centimes;
}

export interface Facture {
  id: FactureId;
  tenantId: string;
  logementId: string;
  reservationId: string | null;
  numero: string;
  clientNom: string;
  clientEmail: string | null;
  dateEmission: string; // AAAA-MM-JJ
  echeance: string | null;
  montantHtCentimes: Centimes;
  tvaCentimes: Centimes;
  taxeSejourCentimes: Centimes;
  montantTtcCentimes: Centimes;
  statut: StatutFacture;
  notes: string | null;
  lignes: FactureLigne[];
  createdAt: Date;
  updatedAt: Date;
}

export function numeroFactureValide(numero: string): boolean {
  return /^[A-Z0-9][A-Z0-9-]{2,31}$/.test(numero);
}

export function totalLigne(
  quantite: number,
  prixUnitaireCentimes: Centimes,
): Centimes {
  if (!Number.isInteger(quantite) || quantite <= 0) {
    throw new Error("La quantité doit être un entier strictement positif.");
  }
  if (!Number.isInteger(prixUnitaireCentimes) || prixUnitaireCentimes < 0) {
    throw new Error("Le prix unitaire doit être un entier positif.");
  }
  return quantite * prixUnitaireCentimes;
}

export function totauxFacture(
  lignes: Pick<FactureLigne, "totalCentimes">[],
  tvaCentimes: Centimes,
  taxeSejourCentimes: Centimes,
): { htCentimes: Centimes; ttcCentimes: Centimes } {
  for (const ligne of lignes) {
    if (!Number.isInteger(ligne.totalCentimes) || ligne.totalCentimes < 0) {
      throw new Error("Total de ligne invalide.");
    }
  }
  if (!Number.isInteger(tvaCentimes) || tvaCentimes < 0) {
    throw new Error("TVA invalide.");
  }
  if (!Number.isInteger(taxeSejourCentimes) || taxeSejourCentimes < 0) {
    throw new Error("Taxe de séjour invalide.");
  }

  const htCentimes = lignes.reduce((total, l) => total + l.totalCentimes, 0);
  return {
    htCentimes,
    ttcCentimes: htCentimes + tvaCentimes + taxeSejourCentimes,
  };
}
