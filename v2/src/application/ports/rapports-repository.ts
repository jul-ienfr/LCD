/**
 * T504 — Port des requêtes d'agrégats pour le reporting.
 *
 * Fournit les données brutes (réservations d'une période, mandats actifs par
 * logement) nécessaires aux calculs d'agrégats du domaine
 * (`calculerLigneReleve`, `calculerAggregats`, `calculerMixCanal`).
 *
 * Les calculs restent dans le domaine pur ; ce port ne fait que projeter les
 * données de la base. L'implémentation Drizzle vit dans
 * `infrastructure/db/repositories/rapports-repository.ts`.
 */

/** Réservation projetée pour les agrégats de reporting. */
export interface ReservationPeriodeRapport {
  logementId: string;
  /** Début du séjour AAAA-MM-JJ. */
  debut: string;
  /** Fin du séjour AAAA-MM-JJ (exclusive). */
  fin: string;
  /** Statut de la réservation (`confirmee`, `annulee`, …). */
  statut: string;
  montantCentimes: number;
  /**
   * Source de la réservation (`direct`, `widget`, `promo:X`, `utm:…`,
   * `demande:X` ou `fournisseur:<code>`). Sert au mix canal.
   */
  source: string;
}

/** Logement avec son mandat propriétaire actif, pour le relevé. */
export interface LogementAvecMandat {
  logementId: string;
  logementNom: string;
  proprietaireId: string;
  proprietaireNom: string;
  /** Email du propriétaire (null si absent) : destinataire des relevés. */
  proprietaireEmail: string | null;
  commissionBp: number;
  chargesMensuellesCentimes: number;
}

export interface RapportsRepository {
  /**
   * Réservations chevauchant la période `[premierJour, dernierJourExclu)`.
   * Une réservation chevauche si `debut < dernierJourExclu` et
   * `fin > premierJour`. Annulées incluses (le domaine les filtre).
   */
  listerReservationsPeriode(
    tenantId: string,
    premierJour: string,
    dernierJourExclu: string,
  ): Promise<ReservationPeriodeRapport[]>;

  /**
   * Tous les logements du tenant rattachés à un propriétaire par un mandat
   * actif, avec le nom du propriétaire et les termes financiers du mandat.
   */
  listerLogementsAvecMandat(tenantId: string): Promise<LogementAvecMandat[]>;
}
