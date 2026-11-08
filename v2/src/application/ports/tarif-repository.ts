import type { Tarif } from "@/domain/tarif";

export interface DefinirTarifData {
  tenantId: string;
  logementId: string;
  planTarifaireId?: string | null;
  date: string;
  prixCentimes: number;
  prixParPersonneCentimes?: number | null;
  personnesIncluses?: number;
  source?: string;
}

export interface TarifRepository {
  definir(data: DefinirTarifData): Promise<Tarif>;
  definirPlusieurs(data: readonly DefinirTarifData[]): Promise<Tarif[]>;
  listerParMois(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
    planTarifaireId?: string | null,
  ): Promise<Tarif[]>;
  trouver(
    tenantId: string,
    logementId: string,
    date: string,
    planTarifaireId?: string | null,
  ): Promise<Tarif | null>;
}
