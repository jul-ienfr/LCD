import type { StatutEcheance, TypeEcheance } from "@/domain/echeancier";

export interface EcheancePaiement {
  id: string;
  tenantId: string;
  reservationId: string;
  type: TypeEcheance;
  montantCentimes: number;
  exigibleLe: string;
  statut: StatutEcheance;
  paiementId: string | null;
}

export interface CreerEcheancePaiementData {
  tenantId: string;
  reservationId: string;
  type: TypeEcheance;
  montantCentimes: number;
  exigibleLe: string;
  statut?: StatutEcheance;
}

export interface EcheancesPaiementRepository {
  creerPlusieurs(
    echeances: CreerEcheancePaiementData[],
  ): Promise<EcheancePaiement[]>;
  listerParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<EcheancePaiement[]>;
  trouverParId(
    tenantId: string,
    echeanceId: string,
  ): Promise<EcheancePaiement | null>;
  marquerPaye(
    tenantId: string,
    echeanceId: string,
    paiementId: string,
  ): Promise<void>;
  annulerRestantes(tenantId: string, reservationId: string): Promise<number>;
}
