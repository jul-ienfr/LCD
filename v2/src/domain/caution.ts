import type { Centimes } from "./pricing";
import type { TenantId } from "./tenant";

export type StatutCaution =
  | "attendue"
  | "recue"
  | "restituee"
  | "retenue";

export const TRANSITIONS_CAUTION: Record<StatutCaution, StatutCaution[]> = {
  attendue: ["recue"],
  recue: ["restituee", "retenue"],
  restituee: [],
  retenue: [],
};

export const LIBELLES_STATUT_CAUTION: Record<StatutCaution, string> = {
  attendue: "Attendue",
  recue: "Reçue",
  restituee: "Restituée",
  retenue: "Retenue partielle",
};

export interface Caution {
  id: string;
  tenantId: TenantId;
  reservationId: string;
  montantCentimes: Centimes;
  statut: StatutCaution;
  dateReception: string | null;
  dateRestitution: string | null;
  montantRetenuCentimes: Centimes;
  motifRetenue: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function montantCautionValide(montantCentimes: number): boolean {
  return (
    Number.isInteger(montantCentimes) &&
    montantCentimes > 0 &&
    montantCentimes <= 10_000_000
  );
}

export function montantRetenuValide(
  montantRetenuCentimes: number,
  montantCautionCentimes: number,
): boolean {
  return (
    Number.isInteger(montantRetenuCentimes) &&
    montantRetenuCentimes > 0 &&
    montantRetenuCentimes <= montantCautionCentimes
  );
}
