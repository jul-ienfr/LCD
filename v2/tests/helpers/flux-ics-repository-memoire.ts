import type {
  EnregistrerFluxIcsData,
  EnregistrerRunIcsData,
  FluxIcsRepository,
  MarquerSyncFluxIcsData,
  OptionsRecuperationIcs,
  RecuperateurIcs,
  ReponseIcs,
  ResumeSanteIcs,
  RunIcs,
} from "@/application/ports/flux-ics-repository";
import {
  fluxDu,
  fluxEnRetard,
  type FluxIcs,
} from "@/domain/flux-ics";

export class FluxIcsRepositoryMemoire implements FluxIcsRepository {
  private readonly rows: FluxIcs[] = [];
  private readonly runs: RunIcs[] = [];

  async enregistrer(data: EnregistrerFluxIcsData): Promise<FluxIcs> {
    const existant = data.canalId
      ? this.rows.find(
          (f) =>
            f.tenantId === data.tenantId &&
            f.logementId === data.logementId &&
            f.canalId === data.canalId,
        )
      : this.rows.find(
          (f) =>
            f.tenantId === data.tenantId &&
            f.logementId === data.logementId &&
            f.url === data.url,
        );
    if (existant) {
      if (data.canalId !== undefined) existant.canalId = data.canalId;
      existant.libelle = data.libelle;
      existant.url = data.url;
      existant.actif = true;
      existant.intervalleMinutes = data.intervalleMinutes ?? 5;
      existant.updatedAt = new Date();
      return existant;
    }

    const maintenant = new Date();
    const flux: FluxIcs = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      logementId: data.logementId,
      canalId: data.canalId ?? null,
      libelle: data.libelle,
      url: data.url,
      actif: true,
      intervalleMinutes: data.intervalleMinutes ?? 5,
      derniereSync: null,
      derniereTentative: null,
      prochainEssai: null,
      dernierStatut: null,
      dernierMessage: null,
      echecsConsecutifs: 0,
      videsConsecutifs: 0,
      etag: null,
      derniereModification: null,
      empreinte: null,
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

  async listerActifsGlobal(): Promise<FluxIcs[]> {
    return this.rows.filter((f) => f.actif);
  }

  async listerDusGlobal(maintenant: Date, limite: number): Promise<FluxIcs[]> {
    return this.rows
      .filter((f) => f.actif && fluxDu(f, maintenant))
      .slice(0, limite);
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
    flux.derniereTentative = data.date;
    if (data.statut !== "erreur") flux.derniereSync = data.date;
    flux.dernierStatut = data.statut;
    flux.dernierMessage = data.message;
    if (data.etag !== undefined) flux.etag = data.etag;
    if (data.derniereModification !== undefined) {
      flux.derniereModification = data.derniereModification;
    }
    if (data.empreinte !== undefined) flux.empreinte = data.empreinte;
    if (data.echecsConsecutifs !== undefined) {
      flux.echecsConsecutifs = data.echecsConsecutifs;
    }
    if (data.prochainEssai !== undefined) flux.prochainEssai = data.prochainEssai;
    if (data.videsConsecutifs !== undefined) {
      flux.videsConsecutifs = data.videsConsecutifs;
    }
    flux.updatedAt = new Date();
    return flux;
  }

  async enregistrerRun(data: EnregistrerRunIcsData): Promise<void> {
    this.runs.push({
      id: crypto.randomUUID(),
      fluxIcsId: data.fluxIcsId,
      debut: data.debut,
      fin: data.fin,
      statut: data.statut,
      statutHttp: data.statutHttp,
      dureeMs: data.dureeMs,
      evenements: data.evenements,
      crees: data.crees,
      misAJour: data.misAJour,
      annules: data.annules,
      deja: data.deja,
      conflits: data.conflits,
      ignores: data.ignores,
      message: data.message,
      details: data.details ?? null,
    });
  }

  async listerRuns(
    tenantId: string,
    fluxIcsId: string,
    limite: number,
  ): Promise<RunIcs[]> {
    const flux = this.rows.find(
      (f) => f.tenantId === tenantId && f.id === fluxIcsId,
    );
    if (!flux) return [];
    return this.runs
      .filter((run) => run.fluxIcsId === fluxIcsId)
      .sort((a, b) => b.debut.getTime() - a.debut.getTime())
      .slice(0, limite);
  }

  async resumeSanteGlobal(
    maintenant: Date,
    toleranceMinutes: number,
  ): Promise<ResumeSanteIcs> {
    const actifs = this.rows.filter((f) => f.actif);
    const depuis = maintenant.getTime() - 24 * 60 * 60 * 1_000;
    const runs24h = this.runs.filter((run) => run.debut.getTime() >= depuis);
    return {
      actifs: actifs.length,
      enErreur: actifs.filter((f) => f.dernierStatut === "erreur").length,
      enRetard: actifs.filter((f) => fluxEnRetard(f, maintenant, toleranceMinutes))
        .length,
      jamaisSync: actifs.filter((f) => f.derniereSync === null).length,
      conflits24h: runs24h.reduce((somme, run) => somme + run.conflits, 0),
      dernierCycle:
        this.runs.length > 0
          ? new Date(Math.max(...this.runs.map((run) => run.debut.getTime())))
          : null,
    };
  }

  async nettoyerRunsGlobal(jours: number): Promise<number> {
    const avant = Date.now() - jours * 24 * 60 * 60 * 1_000;
    const restants = this.runs.filter((run) => run.debut.getTime() >= avant);
    const supprimes = this.runs.length - restants.length;
    this.runs.splice(0, this.runs.length, ...restants);
    return supprimes;
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
  readonly conditions: Array<OptionsRecuperationIcs | undefined> = [];
  reponse = "";
  nonModifie = false;
  etag: string | null = null;
  derniereModification: string | null = null;
  statutHttp = 200;
  erreur: Error | null = null;

  async recuperer(
    url: string,
    options?: OptionsRecuperationIcs,
  ): Promise<ReponseIcs> {
    this.urls.push(url);
    this.conditions.push(options);
    if (this.erreur) throw this.erreur;
    return {
      nonModifie: this.nonModifie,
      texte: this.nonModifie ? null : this.reponse,
      etag: this.etag,
      derniereModification: this.derniereModification,
      statutHttp: this.statutHttp,
    };
  }
}
