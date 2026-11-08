import type { Caution, ModeCaution, StatutCaution } from "@/domain/caution";

export interface CreerCautionData {
  tenantId: string;
  reservationId: string;
  montantCentimes: number;
  mode?: ModeCaution;
  empreinteId?: string | null;
  empreinteStatut?: string | null;
  notes?: string | null;
}

export interface ResultatCaution {
  caution: Caution;
  cree: boolean;
}

export interface ChangerStatutCautionData {
  statut: StatutCaution;
  dateReception?: string | null;
  dateRestitution?: string | null;
  montantRetenuCentimes?: number;
  motifRetenue?: string | null;
}

export interface CautionRepository {
  creer(data: CreerCautionData): Promise<ResultatCaution>;
  trouverParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<Caution | null>;
  trouverParId(tenantId: string, id: string): Promise<Caution | null>;
  listerParTenant(tenantId: string): Promise<Caution[]>;
  changerStatut(
    tenantId: string,
    id: string,
    data: ChangerStatutCautionData,
  ): Promise<Caution | null>;
  enregistrerEmpreinte(
    tenantId: string,
    id: string,
    data: { empreinteId: string; empreinteStatut: string },
  ): Promise<Caution | null>;
  enregistrerCapture(
    tenantId: string,
    id: string,
    data: { montantCaptureCentimes: number; empreinteStatut: string },
  ): Promise<Caution | null>;
}
