import type { FluxIcs } from "@/domain/flux-ics";
import type { FluxIcsRepository } from "../ports/flux-ics-repository";
import type { SynchroniserFluxIcs } from "./synchroniser-flux-ics";

export interface DetailSyncGlobal {
  fluxId: string;
  tenantId: string;
  logementId: string;
  libelle: string;
  ok: boolean;
  ignore: boolean;
  message: string;
  dureeMs: number;
  conflits: number;
  crees: number;
  misAJour: number;
  annules: number;
}

export interface ResultatSyncGlobal {
  total: number;
  reussis: number;
  erreurs: number;
  ignores: number;
  details: DetailSyncGlobal[];
}

export interface OptionsSyncGlobal {
  force?: boolean;
  limite?: number;
  concurrence?: number;
  maintenant?: Date;
  /** Permet d’interrompre proprement le cycle si le bail est perdu. */
  doitArreter?: () => boolean;
}

export class SynchroniserTousFluxIcs {
  constructor(
    private readonly flux: FluxIcsRepository,
    private readonly synchroniser: SynchroniserFluxIcs,
  ) {}

  async executer(
    options: OptionsSyncGlobal = {},
  ): Promise<ResultatSyncGlobal> {
    const limite = options.limite ?? 100;
    const concurrence = Math.max(1, options.concurrence ?? 4);
    const maintenant = options.maintenant ?? new Date();
    const flux = options.force
      ? (await this.flux.listerActifsGlobal()).slice(0, limite)
      : await this.flux.listerDusGlobal(maintenant, limite);
    const resultat: ResultatSyncGlobal = {
      total: flux.length,
      reussis: 0,
      erreurs: 0,
      ignores: 0,
      details: [],
    };

    // Les flux d'un même logement sont traités en série : le second voit les
    // écritures du premier et peut détecter un chevauchement inter-OTA. Des
    // logements différents restent synchronisés en parallèle.
    const parLogement = new Map<string, FluxIcs[]>();
    for (const item of flux) {
      const cle = `${item.tenantId}:${item.logementId}`;
      const groupe = parLogement.get(cle) ?? [];
      groupe.push(item);
      parLogement.set(cle, groupe);
    }
    const groupes = [...parLogement.values()];

    const traiter = async (item: FluxIcs) => {
      try {
        const sync = await this.synchroniser.executer({
          tenantId: item.tenantId,
          fluxId: item.id,
          force: options.force,
        });
        if (sync.ignore) {
          resultat.ignores += 1;
        } else {
          resultat.reussis += 1;
        }
        resultat.details.push({
          fluxId: item.id,
          tenantId: item.tenantId,
          logementId: item.logementId,
          libelle: item.libelle,
          ok: true,
          ignore: sync.ignore,
          message: sync.message,
          dureeMs: sync.dureeMs,
          conflits: sync.conflits,
          crees: sync.crees,
          misAJour: sync.misAJour,
          annules: sync.annules,
        });
      } catch (error) {
        resultat.erreurs += 1;
        resultat.details.push({
          fluxId: item.id,
          tenantId: item.tenantId,
          logementId: item.logementId,
          libelle: item.libelle,
          ok: false,
          ignore: false,
          message:
            error instanceof Error ? error.message.slice(0, 300) : String(error),
          dureeMs: 0,
          conflits: 0,
          crees: 0,
          misAJour: 0,
          annules: 0,
        });
      }
    };

    let index = 0;
    const travailleur = async () => {
      for (;;) {
        if (options.doitArreter?.()) return;
        const position = index;
        index += 1;
        const groupe = groupes[position];
        if (!groupe) return;
        for (const item of groupe) {
          if (options.doitArreter?.()) return;
          await traiter(item);
        }
      }
    };

    const travailleurs = Array.from(
      { length: Math.min(concurrence, Math.max(1, groupes.length)) },
      () => travailleur(),
    );
    await Promise.all(travailleurs);

    resultat.total = resultat.details.length;
    resultat.details.sort(
      (a, b) =>
        a.tenantId.localeCompare(b.tenantId) ||
        a.libelle.localeCompare(b.libelle),
    );
    return resultat;
  }
}
