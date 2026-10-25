import type { DernierStatutFlux, FluxIcs } from "@/domain/flux-ics";

export interface EnregistrerFluxIcsData {
  tenantId: string;
  logementId: string;
  libelle: string;
  url: string;
}

export interface MarquerSyncFluxIcsData {
  statut: DernierStatutFlux;
  message: string;
  date: Date;
}

export interface FluxIcsRepository {
  enregistrer(data: EnregistrerFluxIcsData): Promise<FluxIcs>;
  listerParLogement(tenantId: string, logementId: string): Promise<FluxIcs[]>;
  listerParTenant(tenantId: string): Promise<FluxIcs[]>;
  listerActifsGlobal(): Promise<FluxIcs[]>;
  trouverParId(tenantId: string, id: string): Promise<FluxIcs | null>;
  marquerSync(
    tenantId: string,
    id: string,
    data: MarquerSyncFluxIcsData,
  ): Promise<FluxIcs | null>;
  supprimer(tenantId: string, id: string): Promise<void>;
}

export interface RecuperateurIcs {
  recuperer(url: string): Promise<string>;
}
