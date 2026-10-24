import type { TenantRepository } from "@/application/ports/tenant-repository";
import type { Tenant } from "@/domain/tenant";

export class TenantRepositoryMemoire implements TenantRepository {
  private readonly rows: Tenant[] = [];

  ajouter(tenant: Tenant): void {
    this.rows.push(tenant);
  }

  async trouver(tenantId: string): Promise<Tenant | null> {
    return this.rows.find((t) => t.id === tenantId) ?? null;
  }
}
