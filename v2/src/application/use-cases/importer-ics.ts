import { ErreurMetier } from "@/domain/erreurs";
import { parserIcs, type TypeEvenementIcs } from "@/domain/ics";
import type { BlocageRepository } from "../ports/blocage-repository";
import type { ReservationRepository } from "../ports/reservation-repository";

export interface ImporterIcsInput {
  tenantId: string;
  logementId: string;
  ics: string;
}

export type ResultatLigneImport = "cree" | "deja" | "conflit" | "ignore";

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
  deja: number;
  blocages: number;
  conflits: number;
  ignores: number;
  lignes: LigneImportIcs[];
}

export class ImporterIcs {
  constructor(
    private readonly reservations: ReservationRepository,
    private readonly blocages: BlocageRepository,
  ) {}

  async executer(input: ImporterIcsInput): Promise<ResultatImportIcs> {
    if (!input.ics.trim()) {
      throw new ErreurMetier(
        "IMPORT_ICS_INVALIDE",
        "Le contenu ICS est vide.",
      );
    }

    const parsing = parserIcs(input.ics);
    if (parsing.evenements.length === 0) {
      throw new ErreurMetier(
        "IMPORT_ICS_INVALIDE",
        "Aucun événement exploitable dans ce calendrier.",
      );
    }

    const resultat: ResultatImportIcs = {
      total: parsing.evenements.length,
      crees: 0,
      deja: 0,
      blocages: 0,
      conflits: 0,
      ignores: parsing.ignores,
      lignes: [],
    };

    for (const evenement of parsing.evenements) {
      const ligne = {
        ref: evenement.ref,
        type: evenement.type,
        debut: evenement.debut,
        fin: evenement.fin,
      };

      const existantReservation = await this.reservations.trouverParRef(
        input.tenantId,
        evenement.ref,
      );
      const existantBlocage = await this.blocages.trouverParRef(
        input.tenantId,
        evenement.ref,
      );
      if (existantReservation || existantBlocage) {
        resultat.deja += 1;
        resultat.lignes.push({
          ...ligne,
          resultat: "deja",
          message: "Déjà importé.",
        });
        continue;
      }

      const chevauche =
        (await this.reservations.chevauche(
          input.tenantId,
          input.logementId,
          evenement.debut,
          evenement.fin,
        )) ||
        (await this.blocages.chevauche(
          input.tenantId,
          input.logementId,
          evenement.debut,
          evenement.fin,
        ));
      if (chevauche) {
        resultat.conflits += 1;
        resultat.lignes.push({
          ...ligne,
          resultat: "conflit",
          message: "Chevauche une réservation ou un blocage existant.",
        });
        continue;
      }

      if (evenement.type === "blocage") {
        const cree = await this.blocages.creer({
          tenantId: input.tenantId,
          logementId: input.logementId,
          ref: evenement.ref,
          debut: evenement.debut,
          fin: evenement.fin,
          source: "import-ics",
          motif: evenement.motif ?? evenement.resume,
        });
        if (cree.cree) {
          resultat.blocages += 1;
          resultat.lignes.push({ ...ligne, resultat: "cree" });
        } else {
          resultat.deja += 1;
          resultat.lignes.push({
            ...ligne,
            resultat: "deja",
            message: "Déjà importé.",
          });
        }
        continue;
      }

      await this.reservations.creer({
        tenantId: input.tenantId,
        logementId: input.logementId,
        ref: evenement.ref,
        clientNom: evenement.clientNom ?? "Réservation OTA",
        voyageurs: evenement.voyageurs,
        debut: evenement.debut,
        fin: evenement.fin,
        montantCentimes: evenement.montantCentimes,
        source: "import-ics",
        statut: "confirmee",
      });
      resultat.crees += 1;
      resultat.lignes.push({ ...ligne, resultat: "cree" });
    }

    return resultat;
  }
}
