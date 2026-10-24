import { eq } from "drizzle-orm";
import type { TenantRepository } from "@/application/ports/tenant-repository";
import type { Tenant } from "@/domain/tenant";
import { withTenant } from "../client";
import { tenants } from "../schema";

export class DrizzleTenantRepository implements TenantRepository {
  async trouver(tenantId: string): Promise<Tenant | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);
      if (!row) return null;
      return {
        id: row.id,
        slug: row.slug,
        nom: row.nom,
        statut: row.statut as Tenant["statut"],
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    });
  }
}
