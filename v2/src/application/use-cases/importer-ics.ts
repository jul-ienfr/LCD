import { ErreurMetier } from "@/domain/erreurs";
import { estCalendrierIcs, parserIcs, type TypeEvenementIcs } from "@/domain/ics";
import {
  calculerPlanReconciliationIcs,
  type ConflitIcs,
} from "@/domain/reconciliation-ics";
import type { ImportIcsRepository } from "../ports/import-ics-repository";

export interface ImporterIcsInput {
  tenantId: string;
  logementId: string;
  /** null = import manuel : les lignes ne sont rattachées à aucun flux. */
  fluxIcsId: string | null;
  ics: string;
  /** false pendant la confirmation d'un calendrier soudainement vide. */
  supprimerAbsents?: boolean;
}

export type ResultatLigneImport =
  | "cree"
  | "mis_a_jour"
  | "remplace"
  | "annule"
  | "deja"
  | "conflit"
  | "ignore";

export interface LigneImportIcs {
  ref: string;
  type: TypeEvenementIcs;
  debut: string;
  fin: string;
  resultat: ResultatLigneImport;
  message?: string;
}

export interface ResultatImportIcs {
  total: number;
  crees: number;
  misAJour: number;
  remplaces: number;
  annules: number;
  blocages: number;
  deja: number;
  conflits: number;
  ignores: number;
  conflitsDetails: ConflitIcs[];
  lignes: LigneImportIcs[];
}

export class ImporterIcs {
  constructor(private readonly repo: ImportIcsRepository) {}

  async executer(input: ImporterIcsInput): Promise<ResultatImportIcs> {
    if (!input.ics.trim()) {
      throw new ErreurMetier(
        "IMPORT_ICS_INVALIDE",
        "Le contenu ICS est vide.",
      );
    }
    if (!estCalendrierIcs(input.ics)) {
      throw new ErreurMetier(
        "IMPORT_ICS_INVALIDE",
        "Ce flux ne contient pas un calendrier iCalendar valide (BEGIN/END:VCALENDAR).",
      );
    }

    const parsing = parserIcs(input.ics);
    const instantane = await this.repo.instantane(
      input.tenantId,
      input.logementId,
    );
    const plan = calculerPlanReconciliationIcs({
      fluxIcsId: input.fluxIcsId,
      evenements: parsing.evenements,
      enregistrements: instantane.enregistrements,
      supprimerAbsents: input.supprimerAbsents,
    });

    await this.repo.appliquer(
      input.tenantId,
      input.logementId,
      input.fluxIcsId,
      plan,
    );

    const lignes: LigneImportIcs[] = [];
    for (const evenement of plan.creer) {
      lignes.push({
        ref: evenement.ref,
        type: evenement.type,
        debut: evenement.debut,
        fin: evenement.fin,
        resultat: "cree",
      });
    }
    for (const miseAJour of plan.mettreAJour) {
      lignes.push({
        ref: miseAJour.evenement.ref,
        type: miseAJour.evenement.type,
        debut: miseAJour.evenement.debut,
        fin: miseAJour.evenement.fin,
        resultat: "mis_a_jour",
      });
    }
    for (const remplacement of plan.remplacer) {
      lignes.push({
        ref: remplacement.evenement.ref,
        type: remplacement.evenement.type,
        debut: remplacement.evenement.debut,
        fin: remplacement.evenement.fin,
        resultat: "remplace",
      });
    }
    for (const enregistrement of plan.supprimer) {
      lignes.push({
        ref: enregistrement.ref,
        type: enregistrement.type,
        debut: enregistrement.debut,
        fin: enregistrement.fin,
        resultat: "annule",
        message: "Retiré du flux OTA.",
      });
    }
    for (const conflit of plan.conflits) {
      lignes.push({
        ref: conflit.ref,
        type: conflit.type,
        debut: conflit.debut,
        fin: conflit.fin,
        resultat: "conflit",
        message: conflit.message,
      });
    }

    const blocages =
      plan.creer.filter((evenement) => evenement.type === "blocage").length +
      plan.remplacer.filter(
        (remplacement) => remplacement.evenement.type === "blocage",
      ).length;

    return {
      total: parsing.evenements.length,
      crees: plan.creer.filter((evenement) => evenement.type === "reservation")
        .length,
      misAJour: plan.mettreAJour.length,
      remplaces: plan.remplacer.length,
      annules: plan.supprimer.length,
      blocages,
      deja: plan.deja,
      conflits: plan.conflits.length,
      ignores: parsing.ignores + plan.ignores,
      conflitsDetails: plan.conflits,
      lignes,
    };
  }
}
