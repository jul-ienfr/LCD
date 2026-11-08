import type {
  DemandeSync,
  DemandeSyncRepository,
} from "@/application/ports/demande-sync-repository";

export interface ResultatCycleDemande {
  total: number;
  erreurs: number;
  verrouille: boolean;
  ownerDisponible: boolean;
  details: Array<{ statut: string; message: string | null }>;
}

export type ExecuteurCycleDemande = (cible: {
  tenantId: string;
  logementId: string;
}) => Promise<ResultatCycleDemande>;

export interface ResultatTraitementDemandes {
  total: number;
  reussies: number;
  echecs: number;
  ownerDisponible: boolean;
  ignoree: boolean;
}

export class TraiterDemandesSync {
  constructor(
    private readonly demandes: DemandeSyncRepository,
    private readonly executerCycle: ExecuteurCycleDemande,
  ) {}

  async executer(
    options: {
      tenantId?: string;
      logementId?: string;
      limite?: number;
    } = {},
  ): Promise<ResultatTraitementDemandes> {
    const cible =
      options.tenantId && options.logementId
        ? { tenantId: options.tenantId, logementId: options.logementId }
        : null;

    let file: DemandeSync[];
    let ignoree = false;
    if (cible) {
      const demande = await this.demandes.trouver(
        cible.tenantId,
        cible.logementId,
      );
      if (demande === undefined) {
        return {
          total: 0,
          reussies: 0,
          echecs: 0,
          ownerDisponible: false,
          ignoree,
        };
      }
      if (demande && demande.disponibleA.getTime() > Date.now()) {
        ignoree = true;
        file = [];
      } else {
        file = demande ? [demande] : [];
      }
    } else {
      const dues = await this.demandes.listerDues(
        Math.max(1, Math.min(options.limite ?? 20, 100)),
      );
      if (dues === null) {
        return {
          total: 0,
          reussies: 0,
          echecs: 0,
          ownerDisponible: false,
          ignoree,
        };
      }
      file = dues;
    }

    let reussies = 0;
    let echecs = 0;
    for (const demande of file) {
      let resultat: ResultatCycleDemande;
      try {
        resultat = await this.executerCycle({
          tenantId: demande.tenantId,
          logementId: demande.logementId,
        });
      } catch (erreur) {
        echecs += 1;
        await this.echouer(
          demande,
          erreur instanceof Error ? erreur.message : "Erreur inconnue.",
          1,
        );
        continue;
      }

      if (resultat.verrouille) {
        echecs += 1;
        await this.echouer(demande, "Synchronisation déjà en cours.", 1);
        continue;
      }
      if (!resultat.ownerDisponible) {
        echecs += 1;
        await this.echouer(demande, "Connexion owner indisponible.", 5);
        continue;
      }

      const erreurDetail = resultat.details.find(
        (detail) => detail.statut === "erreur",
      );
      if (erreurDetail || resultat.erreurs > 0) {
        echecs += 1;
        await this.echouer(
          demande,
          erreurDetail?.message ?? "Erreur pendant la synchronisation.",
          1,
        );
        continue;
      }

      const quota = resultat.details.find(
        (detail) =>
          detail.statut === "ignore" && detail.message?.includes("espacé"),
      );
      if (quota) {
        echecs += 1;
        await this.echouer(
          demande,
          quota.message ?? "Cycle espacé pour préserver le quota.",
          5,
        );
        continue;
      }

      try {
        await this.demandes.marquerTraitee(demande.id, demande.revision);
        reussies += 1;
      } catch {
        echecs += 1;
      }
    }

    return {
      total: file.length,
      reussies,
      echecs,
      ownerDisponible: true,
      ignoree,
    };
  }

  private async echouer(
    demande: DemandeSync,
    erreur: string,
    baseMinutes: number,
  ): Promise<void> {
    const minutes = Math.min(
      60,
      baseMinutes * 2 ** Math.min(demande.tentatives, 5),
    );
    try {
      await this.demandes.marquerEchec(
        demande.id,
        demande.revision,
        erreur,
        new Date(Date.now() + minutes * 60_000),
      );
    } catch {
      return;
    }
  }
}
