import type {
  EntiteData,
  TenantRepository,
} from "@/application/ports/tenant-repository";
import type { Tenant } from "@/domain/tenant";

export class TenantRepositoryMemoire implements TenantRepository {
  private readonly rows: Tenant[] = [];

  ajouter(tenant: Tenant): void {
    this.rows.push(tenant);
  }

  async trouver(tenantId: string): Promise<Tenant | null> {
    return this.rows.find((t) => t.id === tenantId) ?? null;
  }

  async trouverParSlug(slug: string): Promise<Tenant | null> {
    return this.rows.find((t) => t.slug === slug) ?? null;
  }

  async mettreAJourEntite(
    tenantId: string,
    data: EntiteData,
  ): Promise<Tenant | null> {
    const tenant = await this.trouver(tenantId);
    if (!tenant) return null;
    tenant.nom = data.nom;
    tenant.nature = data.nature;
    tenant.regime = data.regime;
    tenant.tva = data.tva;
    tenant.siren = data.siren;
    tenant.adresse = data.adresse;
    tenant.mentionsLegales = data.mentionsLegales;
    tenant.updatedAt = new Date();
    return tenant;
  }
}
