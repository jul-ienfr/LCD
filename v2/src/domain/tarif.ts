import { dateIsoValide } from "./calendrier";

export type TarifId = string;

export interface Tarif {
  id: TarifId;
  tenantId: string;
  logementId: string;
  planTarifaireId?: string | null;
  date: string; // AAAA-MM-JJ
  prixCentimes: number;
  /** Supplément par personne au-delà des personnes incluses, par nuit. */
  prixParPersonneCentimes: number | null;
  /** Occupants sans supplément pour cette nuit (défaut 2). */
  personnesIncluses: number;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

export function prixCentimesValide(prix: number): boolean {
  return Number.isInteger(prix) && prix >= 0 && prix <= 100_000_000;
}

export function tarifValide(date: string, prixCentimes: number): boolean {
  return dateIsoValide(date) && prixCentimesValide(prixCentimes);
}

/** 0 à 20 occupants sans supplément. */
export function personnesInclusesValide(nombre: number): boolean {
  return Number.isInteger(nombre) && nombre >= 0 && nombre <= 20;
}

/** Supplément par personne : absent, ou entier positif plafonné. */
export function prixParPersonneValide(prix?: number | null): boolean {
  return prix === undefined || prix === null || prixCentimesValide(prix);
}
