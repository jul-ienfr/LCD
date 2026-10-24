import type { Tenant } from "@/domain/tenant";

export interface TenantRepository {
  trouver(tenantId: string): Promise<Tenant | null>;
}
