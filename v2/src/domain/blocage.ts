import type { TenantId } from "./tenant";

export interface Blocage {
  id: string;
  tenantId: TenantId;
  logementId: string;
  ref: string;
  debut: string; // AAAA-MM-JJ
  fin: string; // exclusive
  source: string;
  motif: string | null;
  createdAt: Date;
  updatedAt: Date;
}
