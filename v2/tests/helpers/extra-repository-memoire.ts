import type {
  CreerExtraData,
  ExtraRepository,
} from "@/application/ports/extra-repository";
import type { Extra } from "@/domain/extra";

export class ExtraRepositoryMemoire implements ExtraRepository {
  private readonly rows: Extra[] = [];

  async creer(data: CreerExtraData): Promise<Extra> {
    const maintenant = new Date();
    const extra: Extra = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      logementId: data.logementId,
      code: data.code,
      nom: data.nom,
      description: data.description,
      prixCentimes: data.prixCentimes,
      actif: true,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.rows.push(extra);
    return extra;
  }

  async listerActifs(tenantId: string): Promise<Extra[]> {
    return this.rows.filter((e) => e.tenantId === tenantId && e.actif);
  }

  async listerTous(tenantId: string): Promise<Extra[]> {
    return this.rows.filter((e) => e.tenantId === tenantId);
  }

  async trouverParId(tenantId: string, id: string): Promise<Extra | null> {
    return (
      this.rows.find((e) => e.tenantId === tenantId && e.id === id) ?? null
    );
  }

  async changerActif(
    tenantId: string,
    id: string,
    actif: boolean,
  ): Promise<Extra | null> {
    const extra = await this.trouverParId(tenantId, id);
    if (!extra) return null;
    extra.actif = actif;
    return extra;
  }
}
