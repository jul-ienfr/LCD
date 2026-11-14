/**
 * T512 — Export comptable stable.
 *
 * Domaine pur : aucune dépendance SvelteKit, Drizzle ou externe. Produit un
 * journal comptable en partie double (journal des ventes `VTES` et journal de
 * trésorerie `TRES`) à partir des factures et des paiements.
 *
 * Contrat de stabilité :
 * - La liste et l'ordre des colonnes sont figés dans
 *   `COLONNES_EXPORT_COMPTABLE` ; toute évolution passe par une nouvelle
 *   valeur de `VERSION_EXPORT_COMPTABLE` (jamais de renommage silencieux).
 * - Les montants sont des **entiers en centimes** (`debit_centimes`,
 *   `credit_centimes`) pour éviter toute dérive de format selon la locale ;
 *   la colonne `devise` précise `EUR`.
 * - Les lignes sont triées de façon déterministe (date, pièce, compte).
 * - Une facture annulée ou en brouillon ne produit aucune ligne.
 */

import type { Facture } from "./facture";
import type { ModePaiement } from "./paiement";

/** Version du format d'export. Incrémentée en cas de rupture de schéma. */
export const VERSION_EXPORT_COMPTABLE = 1;

export const DEVISE_EXPORT = "EUR";

/** Colonnes figées, dans l'ordre exact de sortie du CSV. */
export const COLONNES_EXPORT_COMPTABLE = [
  "version",
  "journal",
  "date",
  "piece",
  "compte",
  "libelle",
  "debit_centimes",
  "credit_centimes",
  "devise",
] as const;

export type ColonneExportComptable = (typeof COLONNES_EXPORT_COMPTABLE)[number];

export type CodeJournal = "VTES" | "TRES";

// --- Plan comptable (PCG simplifié) ---
export const COMPTE_CLIENTS = "411000";
export const COMPTE_VENTES = "706000";
export const COMPTE_TVA_COLLECTEE = "445710";
export const COMPTE_TAXE_SEJOUR = "447000";
export const COMPTE_BANQUE = "512000";
export const COMPTE_CAISSE = "530000";

export interface LigneJournalComptable {
  journal: CodeJournal;
  /** Date de l'écriture, format AAAA-MM-JJ. */
  date: string;
  /** Numéro de pièce (numéro de facture ou référence de paiement). */
  piece: string;
  compte: string;
  libelle: string;
  debitCentimes: number;
  creditCentimes: number;
}

/** Compte de trésorerie selon le mode de paiement (espèces → caisse). */
export function compteTresorerie(mode: ModePaiement): string {
  return mode === "especes" ? COMPTE_CAISSE : COMPTE_BANQUE;
}

/**
 * Écritures du journal des ventes pour une facture (partie double) :
 * débit clients au TTC, crédit ventes (HT), TVA collectée et taxe de séjour.
 * Une facture annulée ne produit aucune ligne.
 */
export function versLignesJournalFacture(facture: Facture): LigneJournalComptable[] {
  // Seules les factures émises ou payées entrent dans le journal des ventes :
  // un brouillon n'est pas encore une créance, une annulée n'en est plus une.
  if (facture.statut === "annulee" || facture.statut === "brouillon") return [];

  const base = {
    journal: "VTES" as const,
    date: facture.dateEmission,
    piece: facture.numero,
    libelle: facture.clientNom,
  };

  const lignes: LigneJournalComptable[] = [
    {
      ...base,
      compte: COMPTE_CLIENTS,
      debitCentimes: facture.montantTtcCentimes,
      creditCentimes: 0,
    },
  ];

  if (facture.montantHtCentimes > 0) {
    lignes.push({
      ...base,
      compte: COMPTE_VENTES,
      debitCentimes: 0,
      creditCentimes: facture.montantHtCentimes,
    });
  }
  if (facture.tvaCentimes > 0) {
    lignes.push({
      ...base,
      compte: COMPTE_TVA_COLLECTEE,
      debitCentimes: 0,
      creditCentimes: facture.tvaCentimes,
    });
  }
  if (facture.taxeSejourCentimes > 0) {
    lignes.push({
      ...base,
      compte: COMPTE_TAXE_SEJOUR,
      debitCentimes: 0,
      creditCentimes: facture.taxeSejourCentimes,
    });
  }

  return lignes;
}

/**
 * Écriture du journal de trésorerie pour un paiement (partie double) :
 * débit du compte de trésorerie, crédit du compte clients.
 */
export function versLigneJournalPaiement(paiement: {
  ref: string;
  datePaiement: string;
  montantCentimes: number;
  mode: ModePaiement;
  libelle?: string | null;
}): LigneJournalComptable[] {
  if (paiement.montantCentimes <= 0) return [];
  const libelle = paiement.libelle?.trim() || paiement.ref;
  const date = paiement.datePaiement;
  return [
    {
      journal: "TRES",
      date,
      piece: paiement.ref,
      compte: compteTresorerie(paiement.mode),
      libelle,
      debitCentimes: paiement.montantCentimes,
      creditCentimes: 0,
    },
    {
      journal: "TRES",
      date,
      piece: paiement.ref,
      compte: COMPTE_CLIENTS,
      libelle,
      debitCentimes: 0,
      creditCentimes: paiement.montantCentimes,
    },
  ];
}

/**
 * Assemble le journal complet : factures (ventes) puis paiements (trésorerie),
 * trié de façon déterministe par date, pièce puis compte.
 */
export function construireJournalComptable(input: {
  factures: readonly Facture[];
  paiements: readonly {
    ref: string;
    datePaiement: string;
    montantCentimes: number;
    mode: ModePaiement;
    libelle?: string | null;
  }[];
}): LigneJournalComptable[] {
  const ventes = input.factures.flatMap(versLignesJournalFacture);
  const tresorerie = input.paiements.flatMap(versLigneJournalPaiement);
  return [...ventes, ...tresorerie].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.piece !== b.piece) return a.piece.localeCompare(b.piece);
    return a.compte.localeCompare(b.compte);
  });
}

/**
 * Convertit une ligne en tableau de cellules CSV dans l'ordre exact des
 * colonnes figées. Les montants restent des entiers en centimes.
 */
export function versCellulesLigne(
  ligne: LigneJournalComptable,
): (string | number)[] {
  return [
    VERSION_EXPORT_COMPTABLE,
    ligne.journal,
    ligne.date,
    ligne.piece,
    ligne.compte,
    ligne.libelle,
    ligne.debitCentimes,
    ligne.creditCentimes,
    DEVISE_EXPORT,
  ];
}
