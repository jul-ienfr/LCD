import type { Tarif } from "@/domain/tarif";

export interface DefinirTarifData {
  tenantId: string;
  logementId: string;
  date: string;
  prixCentimes: number;
  source?: string;
}

export interface TarifRepository {
  definir(data: DefinirTarifData): Promise<Tarif>;
  listerParMois(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
  ): Promise<Tarif[]>;
  trouver(
    tenantId: string,
    logementId: string,
    date: string,
  ): Promise<Tarif | null>;
}
