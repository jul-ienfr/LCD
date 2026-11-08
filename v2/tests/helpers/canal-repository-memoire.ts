import type {
  CanalRepository,
  CreerCanalData,
  FluxCanalData,
  ModifierCanalData,
} from "@/application/ports/canal-repository";
import type { Canal } from "@/domain/canal";

export class CanalRepositoryMemoire implements CanalRepository {
  readonly rows: Canal[] = [];
  readonly fluxCrees: Array<{ canalId: string; flux: FluxCanalData }> = [];

  async lister(tenantId: string, logementId: string): Promise<Canal[]> {
    return this.rows.filter(
      (canal) =>
        canal.tenantId === tenantId && canal.logementId === logementId,
    );
  }

  async trouverParId(tenantId: string, id: string): Promise<Canal | null> {
    return (
      this.rows.find(
        (canal) => canal.tenantId === tenantId && canal.id === id,
      ) ?? null
    );
  }

  async trouverParCle(
    tenantId: string,
    logementId: string,
    cle: string,
  ): Promise<Canal | null> {
    return (
      this.rows.find(
        (canal) =>
          canal.tenantId === tenantId &&
          canal.logementId === logementId &&
          canal.cle === cle,
      ) ?? null
    );
  }

  async creer(data: CreerCanalData): Promise<Canal> {
    if (
      await this.trouverParCle(data.tenantId, data.logementId, data.cle)
    ) {
      throw new Error("Canal déjà existant.");
    }
    const maintenant = new Date();
    const canal: Canal = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      logementId: data.logementId,
      code: data.code,
      libelle: data.libelle,
      cle: data.cle,
      externalListingId: data.externalListingId,
      actif: data.actif,
      exportActif: data.exportActif,
      bufferJours: data.bufferJours,
      notes: data.notes,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.rows.push(canal);
    if (data.flux) {
      this.fluxCrees.push({ canalId: canal.id, flux: data.flux });
    }
    return canal;
  }

  async modifier(
    tenantId: string,
    id: string,
    data: ModifierCanalData,
  ): Promise<Canal | null> {
    const canal = await this.trouverParId(tenantId, id);
    if (!canal) return null;
    canal.libelle = data.libelle;
    canal.cle = data.cle;
    canal.externalListingId = data.externalListingId;
    canal.actif = data.actif;
    canal.exportActif = data.exportActif;
    canal.bufferJours = data.bufferJours;
    canal.notes = data.notes;
    canal.updatedAt = new Date();
    return canal;
  }

  async supprimer(tenantId: string, id: string): Promise<void> {
    const index = this.rows.findIndex(
      (canal) => canal.tenantId === tenantId && canal.id === id,
    );
    if (index >= 0) this.rows.splice(index, 1);
  }
}
