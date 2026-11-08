export interface DemandeSync {
  id: string;
  tenantId: string;
  logementId: string;
  revision: number;
  tentatives: number;
  disponibleA: Date;
  derniereErreur: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DemandeSyncRepository {
  enregistrer(tenantId: string, logementId: string): Promise<void>;
  trouver(
    tenantId: string,
    logementId: string,
  ): Promise<DemandeSync | null | undefined>;
  listerDues(limite: number): Promise<DemandeSync[] | null>;
  listerPourSupervision(limite: number): Promise<DemandeSync[] | null>;
  relancerToutes(): Promise<number>;
  marquerTraitee(id: string, revision: number): Promise<void>;
  marquerEchec(
    id: string,
    revision: number,
    erreur: string,
    disponibleA: Date,
  ): Promise<void>;
}
