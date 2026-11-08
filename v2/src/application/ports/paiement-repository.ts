import type { ModePaiement, Paiement } from "@/domain/paiement";

export interface CreerPaiementData {
  tenantId: string;
  factureId?: string | null;
  reservationId?: string | null;
  echeanceId?: string | null;
  externalId?: string | null;
  ref: string;
  montantCentimes: number;
  mode: ModePaiement;
  datePaiement: string;
  reference?: string | null;
  notes?: string | null;
}

export interface ResultatPaiement {
  paiement: Paiement;
  cree: boolean;
}

export interface PaiementRepository {
  creer(data: CreerPaiementData): Promise<ResultatPaiement>;
  trouverParRef(tenantId: string, ref: string): Promise<Paiement | null>;
  listerParFacture(tenantId: string, factureId: string): Promise<Paiement[]>;
  listerParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<Paiement[]>;
  listerParMois(
    tenantId: string,
    debut: string,
    fin: string,
  ): Promise<Paiement[]>;
}
