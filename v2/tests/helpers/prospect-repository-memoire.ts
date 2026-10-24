import type {
  CreerProspectData,
  ProspectRepository,
} from "@/application/ports/prospect-repository";
import type { Prospect } from "@/domain/prospect";

export class ProspectRepositoryMemoire implements ProspectRepository {
  private readonly rows: Prospect[] = [];

  async creer(data: CreerProspectData): Promise<Prospect> {
    const maintenant = new Date();
    const prospect: Prospect = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      nom: data.nom,
      email: data.email,
      telephone: data.telephone,
      source: data.source,
      statut: "nouveau",
      notes: data.notes,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.rows.push(prospect);
    return prospect;
  }

  async lister(tenantId: string): Promise<Prospect[]> {
    return this.rows.filter((p) => p.tenantId === tenantId);
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<Prospect | null> {
    return (
      this.rows.find((p) => p.tenantId === tenantId && p.id === id) ?? null
    );
  }

  async changerStatut(
    tenantId: string,
    id: string,
    statut: Prospect["statut"],
  ): Promise<Prospect | null> {
    const prospect = await this.trouverParId(tenantId, id);
    if (!prospect) return null;
    prospect.statut = statut;
    prospect.updatedAt = new Date();
    return prospect;
  }
}
