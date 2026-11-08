import { ErreurMetier } from "./erreurs";

export type TypeEcheance = "acompte" | "solde" | "caution";
export type StatutEcheance = "a_payer" | "paye" | "annule" | "rembourse";

export interface Echeance {
  type: TypeEcheance;
  montantCentimes: number;
  exigibleLe: Date;
  statut: StatutEcheance;
}

export interface Echeancier {
  totalSejourCentimes: number;
  acompte: Echeance;
  solde: Echeance;
  caution: Echeance | null;
}

export interface ParametresEcheancier {
  totalSejourCentimes: number;
  arrivee: Date;
  maintenant?: Date;
  acomptePourcent: number;
  joursSoldeAvantArrivee: number;
  cautionCentimes?: number | null;
}

/**
 * Construit un échéancier déterministe : acompte immédiat, solde avant l'arrivée,
 * caution à l'arrivée. Le solde absorbe l'arrondi pour que la somme des deux
 * paiements égale exactement le total.
 */
export function construireEcheancier(
  parametres: ParametresEcheancier,
): Echeancier {
  const {
    totalSejourCentimes,
    arrivee,
    acomptePourcent,
    joursSoldeAvantArrivee,
    cautionCentimes,
  } = parametres;
  const maintenant = parametres.maintenant ?? new Date();

  if (!Number.isInteger(totalSejourCentimes) || totalSejourCentimes <= 0) {
    throw new ErreurMetier("PAIEMENT_INVALIDE", "Le total du séjour est invalide.");
  }
  if (
    !Number.isFinite(acomptePourcent) ||
    acomptePourcent < 0 ||
    acomptePourcent > 100
  ) {
    throw new ErreurMetier(
      "PAIEMENT_INVALIDE",
      "Le pourcentage d'acompte doit être compris entre 0 et 100.",
    );
  }
  if (
    !Number.isInteger(joursSoldeAvantArrivee) ||
    joursSoldeAvantArrivee < 0 ||
    joursSoldeAvantArrivee > 365
  ) {
    throw new ErreurMetier(
      "PAIEMENT_INVALIDE",
      "Le délai du solde doit être compris entre 0 et 365 jours.",
    );
  }
  if (
    cautionCentimes !== undefined &&
    cautionCentimes !== null &&
    (!Number.isInteger(cautionCentimes) || cautionCentimes < 0)
  ) {
    throw new ErreurMetier("PAIEMENT_INVALIDE", "La caution est invalide.");
  }

  const montantAcompte = Math.round(
    (totalSejourCentimes * acomptePourcent) / 100,
  );
  const montantSolde = totalSejourCentimes - montantAcompte;
  const exigibleSolde = maxDate(
    maintenant,
    retirerJours(arrivee, joursSoldeAvantArrivee),
  );
  const exigibleCaution = maxDate(maintenant, arrivee);

  return {
    totalSejourCentimes,
    acompte: {
      type: "acompte",
      montantCentimes: montantAcompte,
      exigibleLe: maintenant,
      statut: montantAcompte === 0 ? "paye" : "a_payer",
    },
    solde: {
      type: "solde",
      montantCentimes: montantSolde,
      exigibleLe: exigibleSolde,
      statut: montantSolde === 0 ? "paye" : "a_payer",
    },
    caution:
      cautionCentimes && cautionCentimes > 0
        ? {
            type: "caution",
            montantCentimes: cautionCentimes,
            exigibleLe: exigibleCaution,
            statut: "a_payer",
          }
        : null,
  };
}

export interface PalierAnnulation {
  joursAvantMin: number;
  pourcentageRembourse: number;
}

export interface PolitiqueAnnulation {
  paliers: readonly PalierAnnulation[];
  fraisFixeCentimes?: number;
}

/**
 * Remboursement selon le premier palier dont le seuil est atteint.
 * Les paliers sont lus du plus exigeant au plus souple.
 */
export function remboursementAnnulation(
  montantPayeCentimes: number,
  joursAvantArrivee: number,
  politique: PolitiqueAnnulation,
): number {
  if (!Number.isInteger(montantPayeCentimes) || montantPayeCentimes < 0) {
    throw new ErreurMetier(
      "PAIEMENT_INVALIDE",
      "Le montant payé est invalide.",
    );
  }
  if (!Number.isFinite(joursAvantArrivee) || joursAvantArrivee < 0) {
    throw new ErreurMetier(
      "PAIEMENT_INVALIDE",
      "Le nombre de jours avant l'arrivée est invalide.",
    );
  }
  if (politique.paliers.length === 0) {
    throw new ErreurMetier(
      "PAIEMENT_INVALIDE",
      "La politique d'annulation est vide.",
    );
  }

  const paliers = [...politique.paliers].sort(
    (a, b) => b.joursAvantMin - a.joursAvantMin,
  );
  const palier = paliers.find(
    (entree) => joursAvantArrivee >= entree.joursAvantMin,
  );
  if (!palier) return 0;

  const pourcentage = Math.min(100, Math.max(0, palier.pourcentageRembourse));
  const remboursementBrut = Math.round(
    (montantPayeCentimes * pourcentage) / 100,
  );
  const frais = Math.max(0, politique.fraisFixeCentimes ?? 0);
  return Math.max(0, Math.min(montantPayeCentimes, remboursementBrut - frais));
}

function retirerJours(date: Date, jours: number): Date {
  return new Date(date.getTime() - jours * 86_400_000);
}

function maxDate(a: Date, b: Date): Date {
  return a.getTime() >= b.getTime() ? a : b;
}
