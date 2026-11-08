import type {
  DemandeSync,
  DemandeSyncRepository,
} from "@/application/ports/demande-sync-repository";

export class DemandeSyncRepositoryMemoire implements DemandeSyncRepository {
  readonly lignes = new Map<string, DemandeSync>();
  ownerDisponible = true;
  private compteur = 0;

  async enregistrer(tenantId: string, logementId: string): Promise<void> {
    const existante = [...this.lignes.values()].find(
      (ligne) =>
        ligne.tenantId === tenantId && ligne.logementId === logementId,
    );
    const maintenant = new Date();
    if (existante) {
      existante.revision += 1;
      existante.tentatives = 0;
      existante.disponibleA = maintenant;
      existante.derniereErreur = null;
      existante.updatedAt = maintenant;
      return;
    }
    this.compteur += 1;
    const id = `demande-${this.compteur}`;
    this.lignes.set(id, {
      id,
      tenantId,
      logementId,
      revision: 1,
      tentatives: 0,
      disponibleA: maintenant,
      derniereErreur: null,
      createdAt: maintenant,
      updatedAt: maintenant,
    });
  }

  async trouver(
    tenantId: string,
    logementId: string,
  ): Promise<DemandeSync | null | undefined> {
    if (!this.ownerDisponible) return undefined;
    return (
      [...this.lignes.values()].find(
        (ligne) =>
          ligne.tenantId === tenantId && ligne.logementId === logementId,
      ) ?? null
    );
  }

  async listerDues(limite: number): Promise<DemandeSync[] | null> {
    if (!this.ownerDisponible) return null;
    return [...this.lignes.values()]
      .filter((ligne) => ligne.disponibleA.getTime() <= Date.now())
      .sort((a, b) => a.disponibleA.getTime() - b.disponibleA.getTime())
      .slice(0, limite);
  }

  async listerPourSupervision(limite: number): Promise<DemandeSync[] | null> {
    if (!this.ownerDisponible) return null;
    return [...this.lignes.values()].slice(0, limite);
  }

  async relancerToutes(): Promise<number> {
    const maintenant = new Date();
    for (const ligne of this.lignes.values()) {
      ligne.tentatives = 0;
      ligne.disponibleA = maintenant;
      ligne.derniereErreur = null;
      ligne.updatedAt = maintenant;
    }
    return this.lignes.size;
  }

  async marquerTraitee(id: string, revision: number): Promise<void> {
    const ligne = this.lignes.get(id);
    if (ligne?.revision === revision) this.lignes.delete(id);
  }

  async marquerEchec(
    id: string,
    revision: number,
    erreur: string,
    disponibleA: Date,
  ): Promise<void> {
    const ligne = this.lignes.get(id);
    if (ligne?.revision !== revision) return;
    ligne.tentatives += 1;
    ligne.disponibleA = disponibleA;
    ligne.derniereErreur = erreur;
    ligne.updatedAt = new Date();
  }
}
