/**
 * T509 — Alertes des relevés propriétaires : écart de rapprochement,
 * impayés et marge négative.
 *
 * Domaine pur : aucune dépendance SvelteKit, Drizzle ou externe. Combine les
 * signaux du rapprochement bancaire (`rapprochement.ts`), des relances de
 * paiement (`relance-paiement.ts`) et des lignes de relevé
 * (`releve-proprietaire.ts`) en alertes actionnables, triées par sévérité
 * puis par montant décroissant — même convention qu'`alertes-fournisseur.ts`.
 */

import type { LigneReleve } from "./releve-proprietaire";

export type TypeAlerteReleve =
  | "ecart_rapprochement"
  | "impaye"
  | "marge_negative";

export type SeveriteAlerteReleve = "danger" | "alerte";

export interface AlerteReleve {
  id: string;
  type: TypeAlerteReleve;
  severite: SeveriteAlerteReleve;
  logementId: string | null;
  logementNom: string | null;
  proprietaireId: string | null;
  proprietaireNom: string | null;
  /** Montant concerné en centimes (valeur absolue). */
  montantCentimes: number;
  message: string;
}

// --- Seuils ---

/** Écart de rapprochement (bp) au-delà duquel on alerte. Aligné sur `rapprochement.ts`. */
export const SEUIL_ECART_BP = 200;

/** Montant absolu de l'écart (centimes) au-delà duquel il passe en danger : 1 000 €. */
export const SEUIL_ECART_DANGER_CENTIMES = 100_000;

/** Jours de retard d'un impayé au-delà desquels il passe en danger. */
export const SEUIL_RETARD_DANGER_JOURS = 30;

/** Marge nette (centimes) en dessous de laquelle la ligne passe en danger : -1 000 €. */
export const SEUIL_MARGE_DANGER_CENTIMES = -100_000;

// --- Entrées projetées ---

export interface EcartRapprochementAlerte {
  /** Écart en points de base entre crédits relevés et attendus. */
  ecartBp: number;
  /** Montant absolu de l'écart en centimes. */
  ecartCentimes: number;
  /** Période du rapprochement (ex : mois AAAA-MM). */
  periode: string;
}

export interface ImpayeAlerte {
  ref: string;
  montantCentimes: number;
  exigibleLe: string;
  /** Nombre de jours de retard (> 0 si l'échéance est dépassée). */
  joursRetard: number;
  clientNom: string | null;
  logementId?: string | null;
  proprietaireId?: string | null;
  proprietaireNom?: string | null;
}

// --- Construction par signal ---

/**
 * Écart de rapprochement : alerte si l'écart en bp dépasse le seuil.
 * Danger si le montant absolu de l'écart est important.
 */
export function alerterSurEcartRapprochement(
  ecart: EcartRapprochementAlerte,
): AlerteReleve | null {
  if (ecart.ecartBp <= SEUIL_ECART_BP) return null;
  const severite: SeveriteAlerteReleve =
    ecart.ecartCentimes >= SEUIL_ECART_DANGER_CENTIMES ? "danger" : "alerte";
  return {
    id: `ecart:${ecart.periode}`,
    type: "ecart_rapprochement",
    severite,
    logementId: null,
    logementNom: null,
    proprietaireId: null,
    proprietaireNom: null,
    montantCentimes: ecart.ecartCentimes,
    message: `Écart de rapprochement de ${formaterCentimes(ecart.ecartCentimes)} (${ecart.ecartBp} bp) sur la période ${ecart.periode}.`,
  };
}

/** Impayés : une alerte par échéance en retard (joursRetard > 0). */
export function alerterSurImpayes(
  impayes: readonly ImpayeAlerte[],
): AlerteReleve[] {
  return impayes
    .filter((impaye) => impaye.joursRetard > 0)
    .map((impaye) => {
      const severite: SeveriteAlerteReleve =
        impaye.joursRetard >= SEUIL_RETARD_DANGER_JOURS ? "danger" : "alerte";
      return {
        id: `impaye:${impaye.ref}`,
        type: "impaye" as const,
        severite,
        logementId: impaye.logementId ?? null,
        logementNom: null,
        proprietaireId: impaye.proprietaireId ?? null,
        proprietaireNom: impaye.proprietaireNom ?? null,
        montantCentimes: impaye.montantCentimes,
        message: `Impayé ${impaye.ref} de ${formaterCentimes(impaye.montantCentimes)} (${impaye.joursRetard} j de retard).`,
      };
    });
}

/** Marges négatives : une alerte par ligne de relevé dont le net est < 0. */
export function alerterSurMargesNegatives(
  lignes: readonly LigneReleve[],
  proprietaireId?: string | null,
  proprietaireNom?: string | null,
): AlerteReleve[] {
  return lignes
    .filter((ligne) => ligne.netCentimes < 0)
    .map((ligne) => {
      const severite: SeveriteAlerteReleve =
        ligne.netCentimes <= SEUIL_MARGE_DANGER_CENTIMES ? "danger" : "alerte";
      return {
        id: `marge:${ligne.logementId}`,
        type: "marge_negative" as const,
        severite,
        logementId: ligne.logementId,
        logementNom: ligne.logementNom,
        proprietaireId: proprietaireId ?? null,
        proprietaireNom: proprietaireNom ?? null,
        montantCentimes: Math.abs(ligne.netCentimes),
        message: `Marge négative de ${formaterCentimes(Math.abs(ligne.netCentimes))} sur ${ligne.logementNom}.`,
      };
    });
}

/**
 * Combine les trois sources d'alerte et les trie : danger d'abord, puis
 * montant décroissant. Toutes les entrées sont optionnelles.
 */
export function construireAlertesReleves(input: {
  ecartRapprochement?: EcartRapprochementAlerte | null;
  impayes?: readonly ImpayeAlerte[];
  lignesReleve?: readonly LigneReleve[];
  proprietaireId?: string | null;
  proprietaireNom?: string | null;
}): AlerteReleve[] {
  const alertes: AlerteReleve[] = [];

  if (input.ecartRapprochement) {
    const ecart = alerterSurEcartRapprochement(input.ecartRapprochement);
    if (ecart) alertes.push(ecart);
  }
  alertes.push(...alerterSurImpayes(input.impayes ?? []));
  alertes.push(
    ...alerterSurMargesNegatives(
      input.lignesReleve ?? [],
      input.proprietaireId,
      input.proprietaireNom,
    ),
  );

  return [...alertes].sort((a, b) => {
    if (a.severite !== b.severite) return a.severite === "danger" ? -1 : 1;
    return b.montantCentimes - a.montantCentimes;
  });
}

function formaterCentimes(centimes: number): string {
  return `${(centimes / 100).toFixed(2).replace(".", ",")} €`;
}
