export interface RelanceFactureRepository {
  reserver(input: {
    tenantId: string;
    factureId: string;
    jour: string;
    destinataire: string;
  }): Promise<boolean>;
  liberer(tenantId: string, factureId: string, jour: string): Promise<void>;
  listerFactureIds(tenantId: string, jour: string): Promise<string[]>;
}
