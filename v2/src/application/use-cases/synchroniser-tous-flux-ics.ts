import type { FluxIcsRepository } from "../ports/flux-ics-repository";
import type { SynchroniserFluxIcs } from "./synchroniser-flux-ics";

export interface DetailSyncGlobal {
  fluxId: string;
  tenantId: string;
  libelle: string;
  ok: boolean;
  message: string;
}

export interface ResultatSyncGlobal {
  total: number;
  reussis: number;
  erreurs: number;
  details: DetailSyncGlobal[];
}

export class SynchroniserTousFluxIcs {
  constructor(
    private readonly flux: FluxIcsRepository,
    private readonly synchroniser: SynchroniserFluxIcs,
  ) {}

  async executer(): Promise<ResultatSyncGlobal> {
    const flux = await this.flux.listerActifsGlobal();
    const resultat: ResultatSyncGlobal = {
      total: flux.length,
      reussis: 0,
      erreurs: 0,
      details: [],
    };

    for (const item of flux) {
      try {
        const sync = await this.synchroniser.executer({
          tenantId: item.tenantId,
          fluxId: item.id,
        });
        resultat.reussis += 1;
        resultat.details.push({
          fluxId: item.id,
          tenantId: item.tenantId,
          libelle: item.libelle,
          ok: true,
          message: `${sync.crees} réservation(s), ${sync.blocages} blocage(s), ${sync.deja} déjà, ${sync.conflits} conflit(s)`,
        });
      } catch (error) {
        resultat.erreurs += 1;
        resultat.details.push({
          fluxId: item.id,
          tenantId: item.tenantId,
          libelle: item.libelle,
          ok: false,
          message:
            error instanceof Error ? error.message.slice(0, 300) : String(error),
        });
      }
    }

    return resultat;
  }
}
