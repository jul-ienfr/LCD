import type { Canal, CodeCanal } from "@/domain/canal";

export interface FluxCanalData {
  url: string;
  intervalleMinutes: number;
}

export interface CreerCanalData {
  tenantId: string;
  logementId: string;
  code: CodeCanal;
  libelle: string;
  cle: string;
  externalListingId: string | null;
  actif: boolean;
  exportActif: boolean;
  bufferJours: number;
  notes: string | null;
  flux: FluxCanalData | null;
}

export interface ModifierCanalData {
  libelle: string;
  cle: string;
  externalListingId: string | null;
  actif: boolean;
  exportActif: boolean;
  bufferJours: number;
  notes: string | null;
}

export interface CanalRepository {
  lister(tenantId: string, logementId: string): Promise<Canal[]>;
  trouverParId(tenantId: string, id: string): Promise<Canal | null>;
  trouverParCle(
    tenantId: string,
    logementId: string,
    cle: string,
  ): Promise<Canal | null>;
  creer(data: CreerCanalData): Promise<Canal>;
  modifier(
    tenantId: string,
    id: string,
    data: ModifierCanalData,
  ): Promise<Canal | null>;
  supprimer(tenantId: string, id: string): Promise<void>;
}
