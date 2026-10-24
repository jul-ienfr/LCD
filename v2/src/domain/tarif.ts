import { dateIsoValide } from "./calendrier";

export type TarifId = string;

export interface Tarif {
  id: TarifId;
  tenantId: string;
  logementId: string;
  date: string; // AAAA-MM-JJ
  prixCentimes: number;
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
