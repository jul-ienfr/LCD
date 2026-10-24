import type { Facture, FactureLigne } from "@/domain/facture";

export interface CreerFactureData {
  tenantId: string;
  logementId: string;
  reservationId?: string | null;
  numero: string;
  clientNom: string;
  clientEmail?: string | null;
  dateEmission: string;
  echeance?: string | null;
  montantHtCentimes: number;
  tvaCentimes: number;
  taxeSejourCentimes: number;
  montantTtcCentimes: number;
  statut: Facture["statut"];
  notes?: string | null;
  lignes: Omit<FactureLigne, "id">[];
}

export interface FactureRepository {
  creer(data: CreerFactureData): Promise<Facture>;
  listerParMois(
    tenantId: string,
    debut: string,
    fin: string,
  ): Promise<Facture[]>;
  trouver(tenantId: string, id: string): Promise<Facture | null>;
}
