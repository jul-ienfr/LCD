/**
 * Inventaire photo de référence par pièce (spec 006, FR-036).
 *
 * Chaque logement garde, pour chacune de ses pièces, quelques photos de
 * référence prises à l'état de départ. Les photos de preuve d'intervention
 * portent elles aussi leur pièce : la comparaison côte à côte se fait donc
 * pièce par pièce, référence d'un côté, preuves de l'autre.
 *
 * La contenance est bornée par construction : au plus
 * `PHOTOS_REFERENCE_PAR_PIECE_MAX` photos par pièce, et au plus
 * `PIECES_MENAGE_MAX` pièces par logement — soit au pire 600 Mo par logement
 * (15 pièces × 4 photos × 10 Mo), ce qui rend toute éviction inutile.
 *
 * Pur : aucune dépendance base, réseau ou horloge système.
 */

import { ErreurMetier } from "./erreurs";
import { LIBELLE_PIECE_MAX, PIECES_MENAGE_MAX } from "./menage";

/** Photos de référence conservées pour une même pièce. */
export const PHOTOS_REFERENCE_PAR_PIECE_MAX = 4;

/** Longueur maximale de la légende d'une photo de référence. */
export const LEGENDE_PHOTO_MAX = 120;

/** Poids maximal de l'inventaire d'un logement, borne documentée. */
export const POIDS_INVENTAIRE_MAX_OCTETS =
  PIECES_MENAGE_MAX * PHOTOS_REFERENCE_PAR_PIECE_MAX * 10 * 1024 * 1024;

/** Une pièce de photo doit être nommée : 1 à 60 caractères. */
export function piecePhotoValide(piece: string): boolean {
  const valeur = piece.trim();
  return valeur.length >= 1 && valeur.length <= LIBELLE_PIECE_MAX;
}

/**
 * Pièce obligatoire (photo de référence) : normalisée ou refusée.
 */
export function exigerPiecePhoto(piece: string): string {
  const valeur = piece.trim();
  if (!piecePhotoValide(valeur)) {
    throw new ErreurMetier(
      "PHOTO_INVALIDE",
      `La pièce doit contenir 1 à ${LIBELLE_PIECE_MAX} caractères.`,
    );
  }
  return valeur;
}

/**
 * Pièce facultative (photo de preuve) : `""` accepté pour les photos
 * antérieures à FR-036, qui n'étaient pas rattachées à une pièce.
 */
export function validerPiecePhoto(piece: string | undefined): string {
  const valeur = (piece ?? "").trim();
  if (valeur === "") return "";
  if (valeur.length > LIBELLE_PIECE_MAX) {
    throw new ErreurMetier(
      "PHOTO_INVALIDE",
      `La pièce dépasse ${LIBELLE_PIECE_MAX} caractères.`,
    );
  }
  return valeur;
}

/** Légende facultative d'une photo de référence, normalisée. */
export function validerLegendePhoto(legende: string | undefined): string {
  const valeur = (legende ?? "").trim();
  if (valeur.length > LEGENDE_PHOTO_MAX) {
    throw new ErreurMetier(
      "PHOTO_INVALIDE",
      `La légende dépasse ${LEGENDE_PHOTO_MAX} caractères.`,
    );
  }
  return valeur;
}

/** Reste-t-il de la place pour une photo de référence sur cette pièce ? */
export function placePhotoReference(nbExistantes: number): boolean {
  return (
    Number.isInteger(nbExistantes) &&
    nbExistantes >= 0 &&
    nbExistantes < PHOTOS_REFERENCE_PAR_PIECE_MAX
  );
}

export function exigerPlacePhotoReference(nbExistantes: number): void {
  if (!placePhotoReference(nbExistantes)) {
    throw new ErreurMetier(
      "PHOTO_INVALIDE",
      `Une pièce garde au plus ${PHOTOS_REFERENCE_PAR_PIECE_MAX} photos de référence. Supprimez-en une avant d’en ajouter une autre.`,
    );
  }
}

/**
 * État d'une pièce dans la comparaison côte à côte : comparable seulement si
 * les deux côtés existent — l'écran dit lequel manque plutôt que d'afficher
 * une comparaison vide.
 */
export type EtatComparaisonPiece =
  | "vide"
  | "reference_manquante"
  | "preuve_manquante"
  | "comparaison";

export const ETATS_COMPARAISON_PIECE: readonly EtatComparaisonPiece[] = [
  "comparaison",
  "preuve_manquante",
  "reference_manquante",
  "vide",
];

export const LIBELLES_ETAT_COMPARAISON: Record<EtatComparaisonPiece, string> = {
  comparaison: "Comparaison possible",
  preuve_manquante: "Preuve manquante",
  reference_manquante: "Référence manquante",
  vide: "Aucune photo",
};

export function etatComparaisonPiece(
  aReference: boolean,
  aPreuve: boolean,
): EtatComparaisonPiece {
  if (aReference && aPreuve) return "comparaison";
  if (aReference) return "preuve_manquante";
  if (aPreuve) return "reference_manquante";
  return "vide";
}

/**
 * Pièces à comparer : celles du ménage (sa checklist copiée) puis celles de
 * l'inventaire de référence, sans doublon et dans cet ordre. La pièce vide
 * (lignes héritées sans pièce) reste en dernier.
 */
export function piecesAComparer(
  piecesMenage: readonly string[],
  piecesReference: readonly string[],
): string[] {
  const ordre: string[] = [];
  const vues = new Set<string>();
  for (const piece of [...piecesMenage, ...piecesReference]) {
    if (vues.has(piece)) continue;
    vues.add(piece);
    ordre.push(piece);
  }
  const nommees = ordre.filter((piece) => piece !== "");
  return ordre.includes("") ? [...nommees, ""] : nommees;
}
