import type { Caution, StatutCaution } from "@/domain/caution";

export interface CreerCautionData {
  tenantId: string;
  reservationId: string;
  montantCentimes: number;
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
}
