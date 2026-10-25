import type { Blocage } from "@/domain/blocage";

export interface CreerBlocageData {
  tenantId: string;
  logementId: string;
  ref: string;
  debut: string;
  fin: string;
  source?: string;
  motif?: string | null;
}

export interface ResultatBlocage {
  blocage: Blocage;
  cree: boolean;
}

export interface BlocageRepository {
  creer(data: CreerBlocageData): Promise<ResultatBlocage>;
  trouverParRef(tenantId: string, ref: string): Promise<Blocage | null>;
  chevauche(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
  ): Promise<boolean>;
  listerParMois(
    tenantId: string,
    debut: string,
    fin: string,
  ): Promise<Blocage[]>;
  listerTous(tenantId: string): Promise<Blocage[]>;
}
