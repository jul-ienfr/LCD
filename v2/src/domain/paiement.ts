// Paiements reçus sur une facture. Purement métier, sans framework.

import type { Centimes } from "./pricing";

export type ModePaiement =
  | "virement"
  | "especes"
  | "cheque"
  | "cb"
  | "autre";

export const MODES_PAIEMENT: ModePaiement[] = [
  "virement",
  "especes",
  "cheque",
  "cb",
  "autre",
];

export const LIBELLES_MODE_PAIEMENT: Record<ModePaiement, string> = {
  virement: "Virement",
  especes: "Espèces",
  cheque: "Chèque",
  cb: "Carte bancaire",
  autre: "Autre",
};

export interface Paiement {
  id: string;
  tenantId: string;
  factureId: string;
  ref: string;
  montantCentimes: Centimes;
  mode: ModePaiement;
  datePaiement: string; // AAAA-MM-JJ
  reference: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function modePaiementValide(mode: string): mode is ModePaiement {
  return MODES_PAIEMENT.includes(mode as ModePaiement);
}

export function montantPaiementValide(montantCentimes: number): boolean {
  return Number.isInteger(montantCentimes) && montantCentimes > 0;
}

export function refPaiementValide(ref: string): boolean {
  return /^[A-Za-z0-9-]{8,64}$/.test(ref);
}

export function totalPaiements(
  paiements: Pick<Paiement, "montantCentimes">[],
): Centimes {
  return paiements.reduce((total, p) => total + p.montantCentimes, 0);
}

export function resteAPayer(
  montantTtcCentimes: Centimes,
  paiements: Pick<Paiement, "montantCentimes">[],
): Centimes {
  return Math.max(0, montantTtcCentimes - totalPaiements(paiements));
}
