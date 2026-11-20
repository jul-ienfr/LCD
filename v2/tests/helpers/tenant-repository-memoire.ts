import type {
  CreerTenantData,
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

  async listerIdsActifs(): Promise<string[]> {
    return this.rows
      .filter((tenant) => tenant.statut === "actif")
      .map((tenant) => tenant.id);
  }

  async creer(data: CreerTenantData): Promise<Tenant> {
    const maintenant = new Date();
    const tenant: Tenant = {
      id: crypto.randomUUID(),
      slug: data.slug,
      nom: data.nom,
      nature: "nom_propre",
      regime: "micro_bic_non_classe",
      tva: "non",
      siren: null,
      adresse: null,
      mentionsLegales: null,
      statut: "actif",
      ventesSuspendues: false,
      ventesSuspenduesMotif: null,
      ventesSuspenduesLe: null,
      lectureSeule: false,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.rows.push(tenant);
    return tenant;
  }

  async supprimer(tenantId: string): Promise<void> {
    const index = this.rows.findIndex((tenant) => tenant.id === tenantId);
    if (index >= 0) this.rows.splice(index, 1);
  }

  /** Utilitaire de test : instantané de tous les espaces connus. */
  async lister(): Promise<Tenant[]> {
    return [...this.rows];
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

  async suspendreVentes(
    tenantId: string,
    suspendues: boolean,
    motif: string | null,
  ): Promise<Tenant | null> {
    const tenant = await this.trouver(tenantId);
    if (!tenant) return null;
    tenant.ventesSuspendues = suspendues;
    tenant.ventesSuspenduesMotif = suspendues ? motif : null;
    tenant.ventesSuspenduesLe = suspendues ? new Date() : null;
    tenant.updatedAt = new Date();
    return tenant;
  }
}
