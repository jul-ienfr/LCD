/**
 * T505 — Use case `genererReleve()`.
 *
 * Génère (de façon idempotente) le relevé propriétaire d'une période :
 * 1. valide la période (mensuelle ou trimestrielle) ;
 * 2. récupère les logements du propriétaire avec les termes du mandat ;
 * 3. récupère les réservations chevauchant la période ;
 * 4. calcule une ligne par logement via le domaine pur ;
 * 5. agrège et persiste via `RelevesRepository` (idempotent par période).
 *
 * Toute la logique de calcul vit dans `src/domain/releve-proprietaire.ts` ;
 * ce use case n'orchestre que les ports.
 */
import { randomUUID } from "node:crypto";
import { ajouterJours, decalerMois, joursDuMois } from "@/domain/calendrier";
import {
  calculerLigneReleve,
  construireReleve,
  periodeReleveValide,
  type LigneReleve,
  type PeriodeReleve,
  type ReleveProprietaire,
} from "@/domain/releve-proprietaire";
import type { RapportsRepository } from "../ports/rapports-repository";
import type { RelevesRepository } from "../ports/releves-repository";

export interface GenererReleveInput {
  tenantId: string;
  proprietaireId: string;
  proprietaireNom: string;
  /** Premier mois de la période, format AAAA-MM. */
  moisDebut: string;
  periode: PeriodeReleve;
}

export interface ResultatGenererReleve {
  releve: ReleveProprietaire;
  /** `true` si le relevé a été créé, `false` s'il existait déjà (rejeu). */
  cree: boolean;
}

/** Dernier mois couvert par la période selon son type. */
export function moisFinPeriode(
  moisDebut: string,
  periode: PeriodeReleve,
): string {
  return periode === "trimestriel" ? decalerMois(moisDebut, 2) : moisDebut;
}

/** Bornes jour de la période : `[premierJour, dernierJourExclu)`. */
export function bornesPeriode(
  moisDebut: string,
  moisFin: string,
): { premierJour: string; dernierJourExclu: string } {
  const premierJour = `${moisDebut}-01`;
  const jours = joursDuMois(moisFin);
  const dernierJour = jours[jours.length - 1];
  if (!dernierJour) {
    throw new Error(`Mois de fin invalide : ${moisFin}`);
  }
  return { premierJour, dernierJourExclu: ajouterJours(dernierJour, 1) };
}

export class GenererReleve {
  constructor(
    private readonly rapports: RapportsRepository,
    private readonly releves: RelevesRepository,
  ) {}

  async executer(
    input: GenererReleveInput,
  ): Promise<ResultatGenererReleve> {
    const moisFin = moisFinPeriode(input.moisDebut, input.periode);
    if (!periodeReleveValide(input.moisDebut, moisFin, input.periode)) {
      throw new Error(
        `Période de relevé invalide : ${input.moisDebut} / ${input.periode}.`,
      );
    }

    // Mandats actifs du propriétaire concerné.
    const mandats = (
      await this.rapports.listerLogementsAvecMandat(input.tenantId)
    ).filter((mandat) => mandat.proprietaireId === input.proprietaireId);

    const { premierJour, dernierJourExclu } = bornesPeriode(
      input.moisDebut,
      moisFin,
    );
    const reservations = await this.rapports.listerReservationsPeriode(
      input.tenantId,
      premierJour,
      dernierJourExclu,
    );

    const lignes: LigneReleve[] = mandats.map((mandat) =>
      calculerLigneReleve({
        logementId: mandat.logementId,
        logementNom: mandat.logementNom,
        reservations: reservations.filter(
          (reservation) => reservation.logementId === mandat.logementId,
        ),
        commissionBp: mandat.commissionBp,
        chargesMensuellesCentimes: mandat.chargesMensuellesCentimes,
        moisDebut: input.moisDebut,
        moisFin,
      }),
    );

    const releve = construireReleve({
      id: randomUUID(),
      tenantId: input.tenantId,
      proprietaireId: input.proprietaireId,
      proprietaireNom: input.proprietaireNom,
      moisDebut: input.moisDebut,
      moisFin,
      periode: input.periode,
      lignes,
    });

    const { id, cree } = await this.releves.enregistrer(
      input.tenantId,
      releve,
    );
    return { releve: { ...releve, id }, cree };
  }
}
