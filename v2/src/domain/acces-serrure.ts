/**
 * T606/T607 — Domaine des accès serrure connectée.
 *
 * Domaine pur : aucune dépendance SvelteKit, Drizzle, Stripe, Brevo ou S3.
 * Le fournisseur (Nuki) n'est jamais appelé ici : ce module décide seulement
 * ce qu'est un code valide, quelle est sa fenêtre d'utilisation, et comment le
 * révoquer. Le repli manuel (`choisirFournisseur`) garantit qu'une serrure
 * indisponible ne bloque jamais l'arrivée d'un voyageur.
 */
import { ErreurMetier } from "@/domain/erreurs";

// --- Fournisseur ---

export const FOURNISSEURS_SERRURE = ["nuki", "manuel"] as const;
export type FournisseurSerrure = (typeof FOURNISSEURS_SERRURE)[number];

export const STATUTS_ACCES = ["actif", "revoque", "expire"] as const;
export type StatutAcces = (typeof STATUTS_ACCES)[number];

/** Longueur d'un code généré pour une serrure connectée. */
export const CODE_ACCES_LONGUEUR = 6;
/** Heure d'entrée par défaut (arrivée l'après-midi). */
export const HEURE_ARRIVEE_DEFAUT = "15:00";
/** Heure de sortie par défaut (départ le matin). */
export const HEURE_DEPART_DEFAUT = "11:00";
/** Codes courts tolérés pour une saisie manuelle sur la serrure. */
export const CODE_MANUEL_LONGUEUR_MIN = 4;
export const CODE_MANUEL_LONGUEUR_MAX = 8;

export interface CodeAcces {
  id: string;
  /** Référence stable et rejouable (idempotence projet règle 7). */
  ref: string;
  logementId: string;
  reservationId: string | null;
  code: string;
  fournisseur: FournisseurSerrure;
  statut: StatutAcces;
  /** Instant ISO de début de validité. */
  valideDe: string;
  /** Instant ISO de fin de validité. */
  valideA: string;
  creeLe: string;
  revoqueLe: string | null;
  revoquePar: string | null;
  /** Identifiant chez le fournisseur (Nuki), `null` en repli manuel. */
  externalId: string | null;
}

// --- Fenêtre d'accès ---

const FORMAT_JOUR = /^\d{4}-\d{2}-\d{2}$/;
const FORMAT_HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;

function instant(jour: string, heure: string): string {
  if (!FORMAT_JOUR.test(jour)) {
    throw new ErreurMetier("DATE_INVALIDE", `Jour invalide : ${jour}.`);
  }
  if (!FORMAT_HEURE.test(heure)) {
    throw new ErreurMetier("DATE_INVALIDE", `Heure invalide : ${heure}.`);
  }
  return `${jour}T${heure}:00.000Z`;
}

/**
 * Fenêtre pendant laquelle le code ouvre la porte : de l'heure d'arrivée le
 * jour de l'arrivée à l'heure de départ le jour du départ (bornes incluses).
 */
export function fenetreAcces(input: {
  arrivee: string;
  depart: string;
  heureArrivee?: string;
  heureDepart?: string;
}): { valideDe: string; valideA: string } {
  const valideDe = instant(input.arrivee, input.heureArrivee ?? HEURE_ARRIVEE_DEFAUT);
  const valideA = instant(input.depart, input.heureDepart ?? HEURE_DEPART_DEFAUT);
  if (valideA <= valideDe) {
    throw new ErreurMetier(
      "DATE_INVALIDE",
      "Le départ doit être postérieur à l'arrivée.",
    );
  }
  return { valideDe, valideA };
}

// --- Codes ---

/** Un code de serrure est une suite de 4 à 8 chiffres, rien d'autre. */
export function codeAccesValide(code: string): boolean {
  if (!/^\d+$/.test(code)) return false;
  return (
    code.length >= CODE_MANUEL_LONGUEUR_MIN &&
    code.length <= CODE_MANUEL_LONGUEUR_MAX
  );
}

/**
 * Génère un code de `CODE_ACCES_LONGUEUR` chiffres, sans répétition immédiate
 * et jamais `000000` (codes trop faciles à deviner ou refusés par certaines
 * serrures). `aleatoire` est injectable pour rendre les tests déterministes.
 */
export function genererCodeAcces(aleatoire: () => number = Math.random): string {
  let code = "";
  let tirages = 0;
  while (code.length < CODE_ACCES_LONGUEUR) {
    tirages += 1;
    const tirage = Math.abs(aleatoire()) * 10;
    const chiffre = Math.min(9, Math.floor(tirage));
    const dernier = code[code.length - 1];
    // Un générateur dégradé (toujours le même chiffre) ne doit jamais boucler :
    // au-delà de 100 tirages, on décale le chiffre d'une unité.
    const retenu = tirages > 100 ? (chiffre + (tirages % 9) + 1) % 10 : chiffre;
    if (code.length > 0 && String(retenu) === dernier) continue;
    code += String(retenu);
  }
  if (/^0+$/.test(code)) return "1" + code.slice(1);
  return code;
}

/** L'accès est-il utilisable maintenant ? Bornes incluses, statut actif exigé. */
export function accesActif(acces: CodeAcces, maintenant: string): boolean {
  return (
    acces.statut === "actif" &&
    acces.valideDe <= maintenant &&
    maintenant <= acces.valideA
  );
}

/**
 * T607 — Repli manuel : si la serrure connectée n'est pas disponible (pas de
 * clé, panne, logement non équipé), on produit un code manuel. Cette fonction
 * ne lève jamais : une panne de partenaire ne doit pas bloquer une arrivée.
 */
export function choisirFournisseur(disponible: boolean): FournisseurSerrure {
  return disponible ? "nuki" : "manuel";
}

/** Référence stable : un rejeu produit la même référence. */
export function refAcces(logementId: string, valideDe: string): string {
  const jour = valideDe.slice(0, 10).replace(/-/g, "");
  return `ACC-${logementId.slice(0, 8)}-${jour}`;
}

export function accesManuel(
  code: string,
  input: {
    id: string;
    ref?: string;
    logementId: string;
    reservationId: string | null;
    fenetre: { valideDe: string; valideA: string };
    creeLe: string;
  },
): CodeAcces {
  if (!codeAccesValide(code)) {
    throw new ErreurMetier(
      "ACCES_INVALIDE",
      "Le code d'accès doit contenir de 4 à 8 chiffres.",
    );
  }
  if (input.fenetre.valideA <= input.fenetre.valideDe) {
    throw new ErreurMetier("DATE_INVALIDE", "Fenêtre d'accès incohérente.");
  }
  return {
    id: input.id,
    ref: input.ref ?? refAcces(input.logementId, input.fenetre.valideDe),
    logementId: input.logementId,
    reservationId: input.reservationId,
    code,
    fournisseur: "manuel",
    statut: "actif",
    valideDe: input.fenetre.valideDe,
    valideA: input.fenetre.valideA,
    creeLe: input.creeLe,
    revoqueLe: null,
    revoquePar: null,
    externalId: null,
  };
}

/**
 * Révocation : seul un accès actif peut être révoqué (une double révocation est
 * une erreur, pas un succès silencieux). L'identité du demandeur est
 * obligatoire — la révocation est une action tracée.
 */
export function revoquerAcces(
  acces: CodeAcces,
  options: { par: string; motif?: string; maintenant?: string },
): CodeAcces {
  if (acces.statut === "revoque") {
    throw new ErreurMetier("ACCES_INVALIDE", "Cet accès est déjà révoqué.");
  }
  if (!options.par.trim()) {
    throw new ErreurMetier(
      "ACCES_INVALIDE",
      "La révocation exige l'identité du demandeur.",
    );
  }
  return {
    ...acces,
    statut: "revoque",
    revoqueLe: options.maintenant ?? new Date().toISOString(),
    revoquePar: options.par,
  };
}

/** Libellé d'affichage d'un fournisseur, utilisé par les écrans staff. */
export function libelleFournisseurSerrure(fournisseur: FournisseurSerrure): string {
  return fournisseur === "nuki" ? "Nuki" : "Code manuel";
}
