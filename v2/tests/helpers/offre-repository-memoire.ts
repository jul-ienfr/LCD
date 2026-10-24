import type {
  CreerOffreData,
  OffreRepository,
} from "@/application/ports/offre-repository";
import type { Offre } from "@/domain/offre";

export class OffreRepositoryMemoire implements OffreRepository {
  private readonly rows: Offre[] = [];

  async creer(data: CreerOffreData): Promise<Offre> {
    const maintenant = new Date();
    const offre: Offre = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      prospectId: data.prospectId,
      logementId: data.logementId,
      titre: data.titre,
      montantCentimes: data.montantCentimes,
      statut: "brouillon",
      notes: data.notes,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.rows.push(offre);
    return offre;
  }

  async lister(tenantId: string): Promise<Offre[]> {
    return this.rows.filter((o) => o.tenantId === tenantId);
  }

  async listerParProspect(
    tenantId: string,
    prospectId: string,
  ): Promise<Offre[]> {
    return this.rows.filter(
      (o) => o.tenantId === tenantId && o.prospectId === prospectId,
    );
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<Offre | null> {
    return (
      this.rows.find((o) => o.tenantId === tenantId && o.id === id) ?? null
    );
  }

  async changerStatut(
    tenantId: string,
    id: string,
    statut: Offre["statut"],
  ): Promise<Offre | null> {
    const offre = await this.trouverParId(tenantId, id);
    if (!offre) return null;
    offre.statut = statut;
    offre.updatedAt = new Date();
    return offre;
  }
}
