import { ajouterJours } from "./calendrier";
import { ErreurMetier } from "./erreurs";
import type { CanalFil } from "./fil-voyageur";
import { canalValide } from "./fil-voyageur";

export type DeclencheurAutomatisation =
  | "reservation_creee"
  | "paiement_recu"
  | "j-7"
  | "j-1"
  | "arrivee"
  | "depart"
  | "j+1";

export const DECLENCHEURS: readonly DeclencheurAutomatisation[] = [
  "reservation_creee",
  "paiement_recu",
  "j-7",
  "j-1",
  "arrivee",
  "depart",
  "j+1",
];

export const LIBELLES_DECLENCHEUR: Record<DeclencheurAutomatisation, string> = {
  reservation_creee: "Réservation créée",
  paiement_recu: "Paiement reçu",
  "j-7": "7 jours avant l'arrivée",
  "j-1": "La veille de l'arrivée",
  arrivee: "Le jour de l'arrivée",
  depart: "Le jour du départ",
  "j+1": "Le lendemain du départ",
};

/** Déclencheurs pilotés par une date : les seuls qu'un planificateur balaie. */
export const DECLENCHEURS_DATES: readonly DeclencheurAutomatisation[] = [
  "j-7",
  "j-1",
  "arrivee",
  "depart",
  "j+1",
];

export interface ConditionsAutomatisation {
  logementIds?: string[];
  nuitsMin?: number;
  nuitsMax?: number;
  /** Vide = tous les canaux. */
  canaux?: CanalFil[];
  reservationStatuts?: string[];
}

export interface Automatisation {
  id: string;
  tenantId: string;
  code: string;
  libelle: string;
  declencheur: DeclencheurAutomatisation;
  canal: CanalFil;
  sujet: string | null;
  modele: string;
  conditions: ConditionsAutomatisation;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContexteAutomatisation {
  logementId: string;
  nuits: number;
  canal: CanalFil;
  statutReservation: string;
}

export const MODELE_MIN = 10;
export const MODELE_MAX = 4000;

export function codeAutomatisationValide(code: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,31}$/.test(code);
}

export function normaliserCodeAutomatisation(code: string): string {
  return code
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function declencheurValide(
  declencheur: string,
): declencheur is DeclencheurAutomatisation {
  return (DECLENCHEURS as readonly string[]).includes(declencheur);
}

/**
 * Date à laquelle un déclencheur daté doit partir, par rapport à l'arrivée
 * et au départ de la réservation.
 */
export function dateDeclenchement(
  declencheur: DeclencheurAutomatisation,
  arrivee: string,
  depart: string,
): string | null {
  switch (declencheur) {
    case "j-7":
      return ajouterJours(arrivee, -7);
    case "j-1":
      return ajouterJours(arrivee, -1);
    case "arrivee":
      return arrivee;
    case "depart":
      return depart;
    case "j+1":
      return ajouterJours(depart, 1);
    default:
      return null;
  }
}

export function conditionsRemplies(
  conditions: ConditionsAutomatisation,
  contexte: ContexteAutomatisation,
): boolean {
  if (
    conditions.logementIds &&
    conditions.logementIds.length > 0 &&
    !conditions.logementIds.includes(contexte.logementId)
  ) {
    return false;
  }
  if (conditions.nuitsMin !== undefined && contexte.nuits < conditions.nuitsMin) {
    return false;
  }
  if (conditions.nuitsMax !== undefined && contexte.nuits > conditions.nuitsMax) {
    return false;
  }
  if (
    conditions.canaux &&
    conditions.canaux.length > 0 &&
    !conditions.canaux.includes(contexte.canal)
  ) {
    return false;
  }
  if (
    conditions.reservationStatuts &&
    conditions.reservationStatuts.length > 0 &&
    !conditions.reservationStatuts.includes(contexte.statutReservation)
  ) {
    return false;
  }
  return true;
}

/**
 * Remplace les variables `{{nom}}`. Les variables inconnues restent visibles :
 * mieux vaut un brouillon à corriger qu'un message silencieusement troué.
 */
export function rendreModele(
  modele: string,
  variables: Record<string, string>,
): { texte: string; variablesManquantes: string[] } {
  const manquantes = new Set<string>();
  const texte = modele.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_tout, cle: string) => {
    const valeur = variables[cle];
    if (valeur === undefined || valeur === "") {
      manquantes.add(cle);
      return `{{${cle}}}`;
    }
    return valeur;
  });
  return { texte, variablesManquantes: [...manquantes] };
}

export function validerAutomatisation(input: {
  code: string;
  libelle: string;
  declencheur: string;
  canal: string;
  modele: string;
  sujet?: string | null;
  conditions?: ConditionsAutomatisation;
}): void {
  const code = normaliserCodeAutomatisation(input.code);
  if (!codeAutomatisationValide(code)) {
    throw new ErreurMetier(
      "AUTOMATISATION_INVALIDE",
      "Code d'automatisation invalide (2 à 32 caractères, a-z, 0-9, tirets).",
    );
  }
  const libelle = input.libelle.trim();
  if (libelle.length < 2 || libelle.length > 120) {
    throw new ErreurMetier(
      "AUTOMATISATION_INVALIDE",
      "Le libellé doit contenir 2 à 120 caractères.",
    );
  }
  if (!declencheurValide(input.declencheur)) {
    throw new ErreurMetier("AUTOMATISATION_INVALIDE", "Déclencheur inconnu.");
  }
  if (!canalValide(input.canal)) {
    throw new ErreurMetier("AUTOMATISATION_INVALIDE", "Canal inconnu.");
  }
  const modele = input.modele.trim();
  if (modele.length < MODELE_MIN || modele.length > MODELE_MAX) {
    throw new ErreurMetier(
      "AUTOMATISATION_INVALIDE",
      `Le modèle doit contenir ${MODELE_MIN} à ${MODELE_MAX} caractères.`,
    );
  }
  const sujet = input.sujet?.trim() ?? "";
  if (sujet.length > 200) {
    throw new ErreurMetier("AUTOMATISATION_INVALIDE", "Sujet trop long (200 max).");
  }
  const conditions = input.conditions ?? {};
  if (conditions.nuitsMin !== undefined && conditions.nuitsMin < 1) {
    throw new ErreurMetier(
      "AUTOMATISATION_INVALIDE",
      "Le minimum de nuits doit être au moins 1.",
    );
  }
  if (
    conditions.nuitsMin !== undefined &&
    conditions.nuitsMax !== undefined &&
    conditions.nuitsMax < conditions.nuitsMin
  ) {
    throw new ErreurMetier(
      "AUTOMATISATION_INVALIDE",
      "Le maximum de nuits doit être supérieur au minimum.",
    );
  }
  const canaux = conditions.canaux ?? [];
  if (canaux.some((canal) => !canalValide(canal))) {
    throw new ErreurMetier(
      "AUTOMATISATION_INVALIDE",
      "Condition de canal inconnue.",
    );
  }
}
