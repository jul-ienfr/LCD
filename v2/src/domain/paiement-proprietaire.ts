/**
 * T515 — Domaine des paiements propriétaires (payouts) et de leur rapprochement.
 *
 * Domaine pur : aucune dépendance SvelteKit, Drizzle ou externe.
 * Réutilise les conventions de montants en centimes entiers et le seuil de
 * rapprochement de `rapprochement.ts` (200 bp).
 *
 * Un payout est le paiement du net d'un relevé propriétaire. Il suit un
 * cycle : `en_attente` (généré depuis le relevé), `valide` (montant vérifié),
 * `paye` (paiement effectué), `rapproche` (montant payé rapproché du montant
 * attendu à la tolérance près).
 */
import type { Centimes } from "./pricing";

// --- Types ---

export type StatutPayout = "en_attente" | "valide" | "paye" | "rapproche";

export const STATUTS_PAYOUT: readonly StatutPayout[] = [
  "en_attente",
  "valide",
  "paye",
  "rapproche",
];

export type ModePayout = "virement" | "cheque" | "especes" | "autre";

export const MODES_PAYOUT: readonly ModePayout[] = [
  "virement",
  "cheque",
  "especes",
  "autre",
];

export const LIBELLES_MODE_PAYOUT: Record<ModePayout, string> = {
  virement: "Virement",
  cheque: "Chèque",
  especes: "Espèces",
  autre: "Autre",
};

export interface PayoutProprietaire {
  /** Identifiant unique du payout. */
  id: string;
  /** Identifiant du tenant. */
  tenantId: string;
  /** Identifiant du propriétaire (user). */
  proprietaireId: string;
  /** Relevé d'origine (null si payout hors relevé). */
  releveId: string | null;
  /** Référence idempotente. */
  ref: string;
  /** Montant attendu (net du relevé) en centimes. */
  montantAttenduCentimes: Centimes;
  /** Montant réellement payé en centimes (null tant que non payé). */
  montantPayeCentimes: Centimes | null;
  /** Mode de paiement. */
  mode: ModePayout;
  /** Statut du cycle de payout. */
  statut: StatutPayout;
  /** Date de paiement effective AAAA-MM-JJ (null tant que non payé). */
  datePaiement: string | null;
  /** Note libre. */
  note: string | null;
}

// --- Seuils ---

/**
 * Tolérance de rapprochement en points de base, alignée sur le seuil d'alerte
 * de `rapprochement.ts`. Un écart relatif ≤ tolérance est considéré comme
 * rapproché.
 */
export const TOLERANCE_RAPPROCHEMENT_BP = 200;

// --- Calculs ---

export interface EcartPayout {
  /** Écart absolu en centimes (payé - attendu). */
  ecartCentimes: number;
  /** Écart relatif en points de base par rapport au montant attendu. */
  ecartBp: number;
}

/**
 * Calcule l'écart entre le montant payé et le montant attendu.
 *
 * L'écart en bp est un écart relatif : `|paye - attendu| * 10 000 / attendu`.
 * Si le montant attendu est nul, l'écart en bp est nul si le payé est nul,
 * infini sinon (on renvoie alors un écart en bp très grand pour signaler un
 * écart non rapprochable).
 */
export function calculerEcartPayout(
  montantAttenduCentimes: Centimes,
  montantPayeCentimes: Centimes | null,
): EcartPayout {
  const paye = montantPayeCentimes ?? 0;
  const ecartCentimes = paye - montantAttenduCentimes;

  if (montantAttenduCentimes === 0) {
    // Pas de base de comparaison : tout paiement non nul est un écart maximal.
    return {
      ecartCentimes,
      ecartBp: paye === 0 ? 0 : Number.MAX_SAFE_INTEGER,
    };
  }

  const ecartBp = Math.round(
    (Math.abs(ecartCentimes) * 10_000) / montantAttenduCentimes,
  );
  return { ecartCentimes, ecartBp };
}

/**
 * Détermine si un payout payé est rapproché du montant attendu à la
 * tolérance près.
 *
 * - Un payout non payé n'est jamais rapproché.
 * - Un payout payé est rapproché si l'écart relatif ≤ tolérance.
 */
export function estRapproche(
  montantAttenduCentimes: Centimes,
  montantPayeCentimes: Centimes | null,
  toleranceBp: number = TOLERANCE_RAPPROCHEMENT_BP,
): boolean {
  if (montantPayeCentimes === null) return false;
  const { ecartBp } = calculerEcartPayout(montantAttenduCentimes, montantPayeCentimes);
  return ecartBp <= toleranceBp;
}

/**
 * Statut cible d'un payout après paiement, selon que le montant est rapproché
 * ou non. Retourne `rapproche` si l'écart est dans la tolérance, sinon
 * laisse le statut à `paye` (un écart devra être investigué).
 */
export function statutApresPaiement(
  montantAttenduCentimes: Centimes,
  montantPayeCentimes: Centimes,
  toleranceBp: number = TOLERANCE_RAPPROCHEMENT_BP,
): StatutPayout {
  return estRapproche(montantAttenduCentimes, montantPayeCentimes, toleranceBp)
    ? "rapproche"
    : "paye";
}

// --- Validation ---

export function statutPayoutValide(statut: string): statut is StatutPayout {
  return (STATUTS_PAYOUT as readonly string[]).includes(statut);
}

export function modePayoutValide(mode: string): mode is ModePayout {
  return (MODES_PAYOUT as readonly string[]).includes(mode);
}

export function montantPayoutValide(montantCentimes: number): boolean {
  return Number.isInteger(montantCentimes) && montantCentimes >= 0;
}

export function refPayoutValide(ref: string): boolean {
  return /^[A-Za-z0-9-]{8,64}$/.test(ref);
}

/**
 * Valide la cohérence d'un payout : le statut `rapproche` exige un paiement,
 * le statut `paye` exige une date et un montant payé.
 */
export function payoutCoherent(payout: PayoutProprietaire): boolean {
  if (!montantPayoutValide(payout.montantAttenduCentimes)) return false;
  if (payout.montantPayeCentimes !== null && !montantPayoutValide(payout.montantPayeCentimes)) {
    return false;
  }

  switch (payout.statut) {
    case "en_attente":
    case "valide":
      // Pas encore payé : montant payé et date doivent être nuls.
      return payout.montantPayeCentimes === null && payout.datePaiement === null;
    case "paye":
    case "rapproche":
      // Payé : montant payé et date requis.
      return payout.montantPayeCentimes !== null && payout.datePaiement !== null;
    default:
      return false;
  }
}

// --- Agrégat de suivi ---

export interface SuiviPayouts {
  /** Nombre total de payouts. */
  total: number;
  enAttente: number;
  valide: number;
  paye: number;
  rapproche: number;
  /** Somme des montants attendus en centimes. */
  totalAttenduCentimes: Centimes;
  /** Somme des montants payés en centimes (0 si null). */
  totalPayeCentimes: Centimes;
  /** Nombre de payouts payés avec écart au-delà de la tolérance. */
  enEcart: number;
}

/**
 * Agrège une liste de payouts en indicateurs de suivi.
 */
export function agregerPayouts(
  payouts: readonly PayoutProprietaire[],
  toleranceBp: number = TOLERANCE_RAPPROCHEMENT_BP,
): SuiviPayouts {
  const suivi: SuiviPayouts = {
    total: payouts.length,
    enAttente: 0,
    valide: 0,
    paye: 0,
    rapproche: 0,
    totalAttenduCentimes: 0,
    totalPayeCentimes: 0,
    enEcart: 0,
  };

  for (const payout of payouts) {
    suivi.totalAttenduCentimes += payout.montantAttenduCentimes;
    suivi.totalPayeCentimes += payout.montantPayeCentimes ?? 0;

    switch (payout.statut) {
      case "en_attente":
        suivi.enAttente += 1;
        break;
      case "valide":
        suivi.valide += 1;
        break;
      case "paye":
        suivi.paye += 1;
        break;
      case "rapproche":
        suivi.rapproche += 1;
        break;
    }

    // Un payout payé avec un écart au-delà de la tolérance est signalé.
    if (payout.montantPayeCentimes !== null) {
      const { ecartBp } = calculerEcartPayout(
        payout.montantAttenduCentimes,
        payout.montantPayeCentimes,
      );
      if (ecartBp > toleranceBp) {
        suivi.enEcart += 1;
      }
    }
  }

  return suivi;
}
