/**
 * T500 — Domaine relevé propriétaire (agrégats, commission, arrondis).
 *
 * Domaine pur : aucune dépendance SvelteKit, Drizzle ou externe.
 * Réutilise `commission.ts` pour les calculs de commission.
 *
 * Un relevé propriétaire couvre une période (mois ou trimestre) et agrège
 * les données financières par logement : CA, commission, charges, net.
 */

import { montantCommission, netProprietaire } from "./commission";
import { moisValide, joursDuMois, decalerMois } from "./calendrier";
import type { Centimes } from "./pricing";

// --- Types ---

export type PeriodeReleve = "mensuel" | "trimestriel";

export interface LigneReleve {
  /** Identifiant du logement */
  logementId: string;
  /** Nom affiché du logement */
  logementNom: string;
  /** Nombre de séjours (réservations non annulées) */
  sejours: number;
  /** Chiffre d'affaires en centimes (somme des réservations non annulées) */
  caCentimes: Centimes;
  /** Commission en centimes */
  commissionCentimes: Centimes;
  /** Charges forfaitaires mensuelles en centimes */
  chargesCentimes: Centimes;
  /** Net propriétaire en centimes (CA - commission - charges) */
  netCentimes: Centimes;
}

export interface ReleveProprietaire {
  /** Identifiant unique du relevé */
  id: string;
  /** Identifiant du tenant */
  tenantId: string;
  /** Identifiant du propriétaire (user) */
  proprietaireId: string;
  /** Nom du propriétaire */
  proprietaireNom: string;
  /** Mois de début de période (AAAA-MM) */
  moisDebut: string;
  /** Mois de fin de période (AAAA-MM) */
  moisFin: string;
  /** Type de période */
  periode: PeriodeReleve;
  /** Lignes par logement */
  lignes: readonly LigneReleve[];
  /** Totaux agrégés */
  totalCaCentimes: Centimes;
  totalCommissionCentimes: Centimes;
  totalChargesCentimes: Centimes;
  totalNetCentimes: Centimes;
  /** Date de génération */
  genereAt: string;
}

// --- Agrégats KPI (T504) ---

export interface AggregatsPeriode {
  /** Nombre total de nuits disponibles (logements × jours) */
  nuitsDisponibles: number;
  /** Nombre de nuits réservées (non annulées) */
  nuitsReservees: number;
  /** Taux d'occupation (0-1) */
  tauxOccupation: number;
  /** ADR (Average Daily Rate) en centimes */
  adrCentimes: Centimes;
  /** RevPAR (Revenue Per Available Room) en centimes */
  revparCentimes: Centimes;
}

export interface MixCanal {
  /** Code du canal */
  canal: string;
  /** Nombre de réservations */
  reservations: number;
  /** CA en centimes */
  caCentimes: Centimes;
  /** Part du CA total (0-1) */
  partCa: number;
}

// --- Validation ---

/**
 * Valide qu'un mois est au format AAAA-MM.
 */
export function moisReleveValide(mois: string): boolean {
  return moisValide(mois);
}

/**
 * Valide qu'une période de relevé est cohérente.
 * - mensuel : moisDebut === moisFin
 * - trimestriel : moisFin = moisDebut + 2 mois
 */
export function periodeReleveValide(
  moisDebut: string,
  moisFin: string,
  periode: PeriodeReleve,
): boolean {
  if (!moisReleveValide(moisDebut) || !moisReleveValide(moisFin)) return false;
  if (periode === "mensuel") return moisDebut === moisFin;
  if (periode === "trimestriel") {
    return moisFin === decalerMois(moisDebut, 2);
  }
  return false;
}

// --- Calculs ---

/**
 * Calcule une ligne de relevé pour un logement.
 *
 * @param logementId - Identifiant du logement
 * @param logementNom - Nom affiché
 * @param reservations - Liste des réservations (montant, statut, nuits)
 * @param commissionBp - Taux de commission en points de base
 * @param chargesMensuellesCentimes - Charges forfaitaires mensuelles
 * @param moisDebut - Premier mois de la période
 * @param moisFin - Dernier mois de la période
 */
export function calculerLigneReleve(input: {
  logementId: string;
  logementNom: string;
  reservations: readonly {
    montantCentimes: number;
    statut: string;
    debut: string;
    fin: string;
  }[];
  commissionBp: number;
  chargesMensuellesCentimes: number;
  moisDebut: string;
  moisFin: string;
}): LigneReleve {
  // Filtrer les réservations non annulées qui chevauchent la période
  const joursPeriode = new Set<string>();
  let mois = input.moisDebut;
  while (mois <= input.moisFin) {
    for (const jour of joursDuMois(mois)) {
      joursPeriode.add(jour);
    }
    mois = decalerMois(mois, 1);
  }

  const resasValides = input.reservations.filter((r) => {
    if (r.statut === "annulee") return false;
    // Vérifier le chevauchement avec la période
    // Une réservation [debut, fin) chevauche si debut < finPeriode et fin > debutPeriode
    const premierJour = [...joursPeriode][0]!;
    const dernierJour = [...joursPeriode].sort().pop()!;
    return r.debut <= dernierJour && r.fin > premierJour;
  });

  const caCentimes = resasValides.reduce(
    (total, r) => total + Math.max(0, r.montantCentimes),
    0,
  );
  const commissionCentimes = montantCommission(caCentimes, input.commissionBp);
  // Charges proportionnelles au nombre de mois dans la période
  const nombreMois = nombreMoisEntre(input.moisDebut, input.moisFin);
  const chargesCentimes = Math.round(
    input.chargesMensuellesCentimes * nombreMois,
  );
  const netCentimes = caCentimes - commissionCentimes - chargesCentimes;

  return {
    logementId: input.logementId,
    logementNom: input.logementNom,
    sejours: resasValides.length,
    caCentimes,
    commissionCentimes,
    chargesCentimes,
    netCentimes,
  };
}

/**
 * Construit un relevé propriétaire complet à partir des lignes.
 * Calcule les totaux automatiquement.
 */
export function construireReleve(input: {
  id: string;
  tenantId: string;
  proprietaireId: string;
  proprietaireNom: string;
  moisDebut: string;
  moisFin: string;
  periode: PeriodeReleve;
  lignes: readonly LigneReleve[];
}): ReleveProprietaire {
  if (!periodeReleveValide(input.moisDebut, input.moisFin, input.periode)) {
    throw new Error("Période de relevé invalide.");
  }

  const totalCaCentimes = input.lignes.reduce((s, l) => s + l.caCentimes, 0);
  const totalCommissionCentimes = input.lignes.reduce(
    (s, l) => s + l.commissionCentimes,
    0,
  );
  const totalChargesCentimes = input.lignes.reduce(
    (s, l) => s + l.chargesCentimes,
    0,
  );
  const totalNetCentimes = input.lignes.reduce((s, l) => s + l.netCentimes, 0);

  return {
    ...input,
    totalCaCentimes,
    totalCommissionCentimes,
    totalChargesCentimes,
    totalNetCentimes,
    genereAt: new Date().toISOString(),
  };
}

// --- Agrégats KPI ---

/**
 * Calcule les agrégats de performance pour une période.
 *
 * @param logements - Nombre de logements actifs
 * @param moisDebut - Premier mois
 * @param moisFin - Dernier mois
 * @param reservations - Réservations non annulées avec nuits et montant
 */
export function calculerAggregats(input: {
  logements: number;
  moisDebut: string;
  moisFin: string;
  reservations: readonly {
    nuits: number;
    montantCentimes: number;
  }[];
}): AggregatsPeriode {
  const nombreMois = nombreMoisEntre(input.moisDebut, input.moisFin);
  const joursTotal = nombreMois * 30; // Approximation pour le calcul
  // Calcul plus précis : somme des jours de chaque mois
  let joursReels = 0;
  let mois = input.moisDebut;
  while (mois <= input.moisFin) {
    joursReels += joursDuMois(mois).length;
    mois = decalerMois(mois, 1);
  }

  const nuitsDisponibles = input.logements * joursReels;
  const nuitsReservees = input.reservations.reduce((s, r) => s + r.nuits, 0);
  const tauxOccupation =
    nuitsDisponibles > 0 ? Math.min(1, nuitsReservees / nuitsDisponibles) : 0;
  const caTotal = input.reservations.reduce(
    (s, r) => s + r.montantCentimes,
    0,
  );
  const adrCentimes = nuitsReservees > 0 ? Math.round(caTotal / nuitsReservees) : 0;
  const revparCentimes =
    nuitsDisponibles > 0 ? Math.round(caTotal / nuitsDisponibles) : 0;

  return {
    nuitsDisponibles,
    nuitsReservees,
    tauxOccupation,
    adrCentimes,
    revparCentimes,
  };
}

/**
 * Calcule la répartition du CA par canal.
 */
export function calculerMixCanal(
  reservations: readonly {
    canal: string;
    montantCentimes: number;
  }[],
): MixCanal[] {
  const parCanal = new Map<
    string,
    { reservations: number; caCentimes: number }
  >();

  for (const r of reservations) {
    const existant = parCanal.get(r.canal) ?? { reservations: 0, caCentimes: 0 };
    existant.reservations += 1;
    existant.caCentimes += Math.max(0, r.montantCentimes);
    parCanal.set(r.canal, existant);
  }

  const caTotal = [...parCanal.values()].reduce((s, v) => s + v.caCentimes, 0);

  return [...parCanal.entries()]
    .map(([canal, donnees]) => ({
      canal,
      reservations: donnees.reservations,
      caCentimes: donnees.caCentimes,
      partCa: caTotal > 0 ? donnees.caCentimes / caTotal : 0,
    }))
    .sort((a, b) => b.caCentimes - a.caCentimes);
}

// --- Helpers internes ---

/**
 * Nombre de mois entre deux mois (inclus).
 */
function nombreMoisEntre(moisDebut: string, moisFin: string): number {
  let count = 0;
  let mois = moisDebut;
  while (mois <= moisFin) {
    count++;
    mois = decalerMois(mois, 1);
  }
  return count;
}
