import type {
  EtatDesLieux,
  LigneEtatDesLieux,
  TypeEtatDesLieux,
} from "@/domain/etat-des-lieux";

export interface CreerEtatDesLieuxData {
  tenantId: string;
  logementId: string;
  reservationId: string | null;
  ref: string;
  type: TypeEtatDesLieux;
  date: string;
  notes: string;
  lignes: LigneEtatDesLieux[];
}

export interface EtatsDesLieuxRepository {
  creer(data: CreerEtatDesLieuxData): Promise<EtatDesLieux>;
  trouverParRef(tenantId: string, ref: string): Promise<EtatDesLieux | null>;
  trouverParId(tenantId: string, id: string): Promise<EtatDesLieux | null>;
  listerParTenant(tenantId: string): Promise<EtatDesLieux[]>;
}
