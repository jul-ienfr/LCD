/**
 * Cycle de preuve d'une intervention (spec 006, FR-032 et FR-033).
 *
 * soumise → validée ou refusée (motif obligatoire) → reprise. Un refus renvoie
 * la mission en reprise : le motif reste visible côté intervenant, qui corrige
 * son intervention puis la resoumet. Chaque passage est historisé
 * (`TransitionPreuve`, table `preuves_intervention_transitions`).
 *
 * Le cycle est fermé : une preuve validée est finale, et aucune transition
 * n'est possible sans la précédente (on ne valide pas ce qui n'a pas été
 * soumis).
 *
 * Pur : aucune dépendance base, réseau ou horloge système.
 */

import { ErreurMetier } from "./erreurs";

export type StatutPreuve = "a_soumettre" | "soumise" | "validee" | "refusee";

export const STATUTS_PREUVE: readonly StatutPreuve[] = [
  "a_soumettre",
  "soumise",
  "validee",
  "refusee",
];

export const LIBELLES_STATUT_PREUVE: Record<StatutPreuve, string> = {
  a_soumettre: "À soumettre",
  soumise: "En attente de validation",
  validee: "Validée",
  refusee: "En reprise",
};

/** Motif de refus : obligatoire, assez précis pour guider la correction. */
export const MOTIF_REFUS_MIN = 10;
export const MOTIF_REFUS_MAX = 1000;

/** Transitions autorisées du cycle de preuve. */
export const TRANSITIONS_PREUVE: Record<StatutPreuve, readonly StatutPreuve[]> =
  {
    a_soumettre: ["soumise"],
    soumise: ["validee", "refusee"],
    refusee: ["soumise"],
    validee: [],
  };

export interface TransitionPreuve {
  id: string;
  tenantId: string;
  missionId: string;
  /** Statut quitté ; `null` pour la toute première soumission. */
  de: StatutPreuve | null;
  vers: StatutPreuve;
  /** Motif de refus ; `null` pour une soumission ou une validation. */
  motif: string | null;
  /** Auteur de la transition (identifiant de session). */
  qui: string;
  createdAt: Date;
}

/** Statut de preuve stocké (`null` = jamais soumise). */
export function statutPreuve(valeur: string | null | undefined): StatutPreuve {
  return valeur && (STATUTS_PREUVE as readonly string[]).includes(valeur)
    ? (valeur as StatutPreuve)
    : "a_soumettre";
}

export function transitionPreuveAutorisee(
  de: StatutPreuve,
  vers: StatutPreuve,
): boolean {
  return TRANSITIONS_PREUVE[de].includes(vers);
}

function raisonTransition(de: StatutPreuve, vers: StatutPreuve): string {
  if (de === "validee") {
    return "La preuve est déjà validée : son cycle est terminé.";
  }
  if (de === vers) {
    return vers === "soumise"
      ? "La preuve est déjà en attente de validation."
      : "Cette transition est déjà enregistrée.";
  }
  if (de === "a_soumettre") {
    return vers === "refusee"
      ? "La preuve n’a pas encore été soumise : elle ne peut pas être refusée."
      : "La preuve n’a pas encore été soumise : elle ne peut pas être validée.";
  }
  if (de === "refusee") {
    return "La preuve refusée doit être resoumise après correction.";
  }
  return "Transition de preuve impossible.";
}

/** Lève une erreur métier si la transition demandée sort du cycle. */
export function exigerTransitionPreuve(
  de: StatutPreuve,
  vers: StatutPreuve,
): void {
  if (!transitionPreuveAutorisee(de, vers)) {
    throw new ErreurMetier("PREUVE_INVALIDE", raisonTransition(de, vers));
  }
}

/**
 * On ne soumet que ce qui a été fait : la preuve suit la fin pointée de la
 * mission (FR-031), jamais l'inverse.
 */
export function exigerMissionTerminee(mission: {
  statut: string;
  finReelle: Date | null;
}): void {
  if (mission.statut === "annulee") {
    throw new ErreurMetier(
      "PREUVE_INVALIDE",
      "Mission annulée : aucune preuve ne peut être soumise.",
    );
  }
  if (mission.statut !== "terminee" || !mission.finReelle) {
    throw new ErreurMetier(
      "PREUVE_INVALIDE",
      "La preuve ne peut être soumise qu’après la fin pointée de la mission.",
    );
  }
}

/** Motif de refus normalisé, ou erreur métier s'il est absent ou hors bornes. */
export function validerMotifRefus(motif: string | null | undefined): string {
  const propre = (motif ?? "").trim();
  if (propre.length < MOTIF_REFUS_MIN || propre.length > MOTIF_REFUS_MAX) {
    throw new ErreurMetier(
      "PREUVE_INVALIDE",
      `Le motif de refus est obligatoire (${MOTIF_REFUS_MIN} à ${MOTIF_REFUS_MAX} caractères).`,
    );
  }
  return propre;
}

/** Une preuve refusée demande une correction puis une resoumission. */
export function enReprise(statut: StatutPreuve): boolean {
  return statut === "refusee";
}
