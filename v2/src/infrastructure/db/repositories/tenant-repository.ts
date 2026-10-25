import { eq } from "drizzle-orm";
import type {
  EntiteData,
  TenantRepository,
} from "@/application/ports/tenant-repository";
import type { Tenant } from "@/domain/tenant";
import { db, withTenant } from "../client";
import { tenants } from "../schema";

function versDomaine(row: typeof tenants.$inferSelect): Tenant {
  return {
    id: row.id,
    slug: row.slug,
    nom: row.nom,
    nature: row.nature as Tenant["nature"],
    regime: row.regime as Tenant["regime"],
    tva: row.tva as Tenant["tva"],
    siren: row.siren,
    adresse: row.adresse,
    mentionsLegales: row.mentionsLegales,
    statut: row.statut as Tenant["statut"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleTenantRepository implements TenantRepository {
  async trouver(tenantId: string): Promise<Tenant | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async trouverParSlug(slug: string): Promise<Tenant | null> {
    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    return row ? versDomaine(row) : null;
  }

  async mettreAJourEntite(
    tenantId: string,
    data: EntiteData,
  ): Promise<Tenant | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(tenants)
        .set({
          nom: data.nom,
          nature: data.nature,
          regime: data.regime,
          tva: data.tva,
          siren: data.siren,
          adresse: data.adresse,
          mentionsLegales: data.mentionsLegales,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId))
        .returning();
      return row ? versDomaine(row) : null;
    });
  }
}
