import { createHash } from "node:crypto";
import { ErreurMetier } from "@/domain/erreurs";
import {
  calculerProchainEssai,
  fluxDu,
} from "@/domain/flux-ics";
import { parserIcs } from "@/domain/ics";
import type {
  EnregistrerRunIcsData,
  FluxIcsRepository,
  RecuperateurIcs,
} from "../ports/flux-ics-repository";
import type { ImporterIcs, ResultatImportIcs } from "./importer-ics";

export interface ResultatSyncFluxIcs extends ResultatImportIcs {
  nonModifie: boolean;
  ignore: boolean;
  suspect: boolean;
  statutHttp: number | null;
  dureeMs: number;
  message: string;
}

function resultatVide(): ResultatImportIcs {
  return {
    total: 0,
    crees: 0,
    misAJour: 0,
    remplaces: 0,
    annules: 0,
    blocages: 0,
    deja: 0,
    conflits: 0,
    ignores: 0,
    conflitsDetails: [],
    lignes: [],
  };
}

function messageResultat(resultat: ResultatImportIcs): string {
  return [
    `${resultat.crees} créée(s)`,
    `${resultat.misAJour} mise(s) à jour`,
    `${resultat.remplaces} remplacée(s)`,
    `${resultat.annules} annulée(s)`,
    `${resultat.blocages} blocage(s)`,
    `${resultat.deja} inchangée(s)`,
    `${resultat.conflits} conflit(s)`,
    `${resultat.ignores} ignoré(s)`,
  ].join(", ");
}

function statsRun(resultat: ResultatImportIcs) {
  return {
    evenements: resultat.total,
    crees: resultat.crees,
    misAJour: resultat.misAJour,
    annules: resultat.annules,
    deja: resultat.deja,
    conflits: resultat.conflits,
    ignores: resultat.ignores,
  };
}

/**
 * L'historique est une observabilité : son échec ne doit pas transformer une
 * synchronisation réussie en erreur ni déclencher un backoff.
 */
async function journaliserRun(
  flux: FluxIcsRepository,
  data: EnregistrerRunIcsData,
): Promise<void> {
  try {
    await flux.enregistrerRun(data);
  } catch {
    // La prochaine synchronisation réessaiera ; l'état du flux reste correct.
  }
}

export class SynchroniserFluxIcs {
  constructor(
    private readonly flux: FluxIcsRepository,
    private readonly recuperateur: RecuperateurIcs,
    private readonly importer: ImporterIcs,
  ) {}

  async executer(input: {
    tenantId: string;
    fluxId: string;
    force?: boolean;
  }): Promise<ResultatSyncFluxIcs> {
    const flux = await this.flux.trouverParId(input.tenantId, input.fluxId);
    if (!flux) {
      throw new ErreurMetier("FLUX_ICS_INVALIDE", "Flux ICS introuvable.");
    }
    if (!flux.actif) {
      throw new ErreurMetier("FLUX_ICS_INVALIDE", "Ce flux ICS est désactivé.");
    }
    if (!input.force && !fluxDu(flux)) {
      return {
        ...resultatVide(),
        nonModifie: false,
        ignore: true,
        suspect: false,
        statutHttp: null,
        dureeMs: 0,
        message: "Pas encore dû.",
      };
    }

    const debut = new Date();
    const chrono = Date.now();
    let statutHttp: number | null = null;

    try {
      const reponse = await this.recuperateur.recuperer(flux.url, {
        etag: flux.etag,
        derniereModification: flux.derniereModification,
      });
      statutHttp = reponse.statutHttp;

      const maintenant = new Date();
      if (reponse.nonModifie || !reponse.texte) {
        const prochainEssai = calculerProchainEssai({
          maintenant,
          intervalleMinutes: flux.intervalleMinutes,
          echecsConsecutifs: 0,
        });
        const message = "Non modifié (HTTP 304).";
        await this.flux.marquerSync(input.tenantId, flux.id, {
          statut: "ok",
          message,
          date: maintenant,
          etag: reponse.etag ?? flux.etag,
          derniereModification:
            reponse.derniereModification ?? flux.derniereModification,
          echecsConsecutifs: 0,
          prochainEssai,
        });
        await journaliserRun(this.flux, {
          tenantId: input.tenantId,
          fluxIcsId: flux.id,
          debut,
          fin: maintenant,
          statut: "ok",
          statutHttp,
          dureeMs: Date.now() - chrono,
          ...statsRun(resultatVide()),
          message,
          details: null,
        });
        return {
          ...resultatVide(),
          nonModifie: true,
          ignore: false,
          suspect: false,
          statutHttp,
          dureeMs: Date.now() - chrono,
          message,
        };
      }

      const empreinte = createHash("sha256")
        .update(reponse.texte)
        .digest("hex");
      const contenuInchange =
        flux.empreinte !== null &&
        flux.empreinte === empreinte &&
        flux.dernierStatut === "ok" &&
        flux.derniereSync !== null &&
        flux.videsConsecutifs === 0;

      if (contenuInchange) {
        const prochainEssai = calculerProchainEssai({
          maintenant,
          intervalleMinutes: flux.intervalleMinutes,
          echecsConsecutifs: 0,
        });
        const message = "Contenu inchangé : aucun import nécessaire.";
        await this.flux.marquerSync(input.tenantId, flux.id, {
          statut: "ok",
          message,
          date: maintenant,
          etag: reponse.etag ?? flux.etag,
          derniereModification:
            reponse.derniereModification ?? flux.derniereModification,
          empreinte,
          echecsConsecutifs: 0,
          prochainEssai,
          videsConsecutifs: 0,
        });
        await journaliserRun(this.flux, {
          tenantId: input.tenantId,
          fluxIcsId: flux.id,
          debut,
          fin: maintenant,
          statut: "ok",
          statutHttp,
          dureeMs: Date.now() - chrono,
          ...statsRun(resultatVide()),
          message,
          details: null,
        });
        return {
          ...resultatVide(),
          nonModifie: true,
          ignore: false,
          suspect: false,
          statutHttp,
          dureeMs: Date.now() - chrono,
          message,
        };
      }

      const parsing = parserIcs(reponse.texte);
      const vide = parsing.evenements.length === 0;
      const premierVideSuspect =
        vide && flux.videsConsecutifs === 0 && flux.derniereSync !== null;
      const videsConsecutifs = vide ? flux.videsConsecutifs + 1 : 0;

      const resultat = await this.importer.executer({
        tenantId: input.tenantId,
        logementId: flux.logementId,
        fluxIcsId: flux.id,
        ics: reponse.texte,
        supprimerAbsents: !premierVideSuspect,
      });

      const prochainEssai = calculerProchainEssai({
        maintenant,
        intervalleMinutes: flux.intervalleMinutes,
        echecsConsecutifs: 0,
      });
      const statut = premierVideSuspect ? "partiel" : "ok";
      let message = messageResultat(resultat);
      if (premierVideSuspect) {
        message =
          "Calendrier vide : suppression des séjours différée au prochain cycle de confirmation. " +
          message;
      } else if (vide) {
        message = `Calendrier vide confirmé. ${message}`;
      }

      await this.flux.marquerSync(input.tenantId, flux.id, {
        statut,
        message,
        date: maintenant,
        etag: reponse.etag ?? flux.etag,
        derniereModification:
          reponse.derniereModification ?? flux.derniereModification,
        empreinte,
        echecsConsecutifs: 0,
        prochainEssai,
        videsConsecutifs,
      });

      await journaliserRun(this.flux, {
        tenantId: input.tenantId,
        fluxIcsId: flux.id,
        debut,
        fin: maintenant,
        statut,
        statutHttp,
        dureeMs: Date.now() - chrono,
        ...statsRun(resultat),
        message,
        details:
          resultat.conflitsDetails.length > 0
            ? { conflits: resultat.conflitsDetails }
            : null,
      });

      return {
        ...resultat,
        nonModifie: false,
        ignore: false,
        suspect: premierVideSuspect,
        statutHttp,
        dureeMs: Date.now() - chrono,
        message,
      };
    } catch (erreur) {
      const maintenant = new Date();
      const echecs = flux.echecsConsecutifs + 1;
      const prochainEssai = calculerProchainEssai({
        maintenant,
        intervalleMinutes: flux.intervalleMinutes,
        echecsConsecutifs: echecs,
      });
      const message = (
        erreur instanceof Error ? erreur.message : String(erreur)
      ).slice(0, 500);
      const statutDansMessage = /HTTP (\d{3})/u.exec(message);
      if (statutDansMessage?.[1]) {
        statutHttp = Number(statutDansMessage[1]);
      }

      await this.flux.marquerSync(input.tenantId, flux.id, {
        statut: "erreur",
        message,
        date: maintenant,
        echecsConsecutifs: echecs,
        prochainEssai,
      });
      await journaliserRun(this.flux, {
        tenantId: input.tenantId,
        fluxIcsId: flux.id,
        debut,
        fin: maintenant,
        statut: "erreur",
        statutHttp,
        dureeMs: Date.now() - chrono,
        ...statsRun(resultatVide()),
        message,
        details: null,
      });
      throw erreur;
    }
  }
}
