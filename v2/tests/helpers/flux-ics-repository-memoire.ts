import type {
  EnregistrerFluxIcsData,
  FluxIcsRepository,
  MarquerSyncFluxIcsData,
  RecuperateurIcs,
} from "@/application/ports/flux-ics-repository";
import type { FluxIcs } from "@/domain/flux-ics";

export class FluxIcsRepositoryMemoire implements FluxIcsRepository {
  private readonly rows: FluxIcs[] = [];

  async enregistrer(data: EnregistrerFluxIcsData): Promise<FluxIcs> {
    const existant = this.rows.find(
      (f) =>
        f.tenantId === data.tenantId &&
        f.logementId === data.logementId &&
        f.url === data.url,
    );
    if (existant) {
      existant.libelle = data.libelle;
      existant.actif = true;
      existant.updatedAt = new Date();
      return existant;
    }

    const maintenant = new Date();
    const flux: FluxIcs = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      logementId: data.logementId,
      libelle: data.libelle,
      url: data.url,
      actif: true,
      derniereSync: null,
      dernierStatut: null,
      dernierMessage: null,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.rows.push(flux);
    return flux;
  }

  async listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<FluxIcs[]> {
    return this.rows.filter(
      (f) => f.tenantId === tenantId && f.logementId === logementId,
    );
  }

  async listerParTenant(tenantId: string): Promise<FluxIcs[]> {
    return this.rows.filter((f) => f.tenantId === tenantId);
  }

  async trouverParId(tenantId: string, id: string): Promise<FluxIcs | null> {
    return (
      this.rows.find((f) => f.tenantId === tenantId && f.id === id) ?? null
    );
  }

  async marquerSync(
    tenantId: string,
    id: string,
    data: MarquerSyncFluxIcsData,
  ): Promise<FluxIcs | null> {
    const flux = await this.trouverParId(tenantId, id);
    if (!flux) return null;
    flux.derniereSync = data.date;
    flux.dernierStatut = data.statut;
    flux.dernierMessage = data.message;
    flux.updatedAt = new Date();
    return flux;
  }

  async supprimer(tenantId: string, id: string): Promise<void> {
    const index = this.rows.findIndex(
      (f) => f.tenantId === tenantId && f.id === id,
    );
    if (index >= 0) this.rows.splice(index, 1);
  }
}

export class RecuperateurIcsMemoire implements RecuperateurIcs {
  readonly urls: string[] = [];
  reponse = "";
  erreur: Error | null = null;

  async recuperer(url: string): Promise<string> {
    this.urls.push(url);
    if (this.erreur) throw this.erreur;
    return this.reponse;
  }
}
