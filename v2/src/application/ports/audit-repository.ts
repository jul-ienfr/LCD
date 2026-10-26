export interface AuditEntry {
  id: string;
  tenantId: string;
  qui: string;
  action: string;
  cible: string | null;
  ref: string | null;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export interface AuditFiltre {
  limite: number;
  decalage: number;
  recherche?: string;
  depuis?: Date;
  prefixe?: string;
}

export interface AuditCriteres {
  recherche?: string;
  depuis?: Date;
  prefixe?: string;
}

export interface AuditRepository {
  lister(tenantId: string, filtre: AuditFiltre): Promise<AuditEntry[]>;
  compter(tenantId: string, criteres?: AuditCriteres): Promise<number>;
}
