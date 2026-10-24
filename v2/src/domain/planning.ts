import { dateIsoValide } from "./calendrier";

/**
 * Deux séjours [debut, fin) se chevauchent si l'un commence avant la fin de
 * l'autre. Les dates sont ISO AAAA-MM-JJ : la comparaison lexicographique
 * est correcte.
 */
export function sejoursSeChevauchent(
  aDebut: string,
  aFin: string,
  bDebut: string,
  bFin: string,
): boolean {
  if (
    !dateIsoValide(aDebut) ||
    !dateIsoValide(aFin) ||
    !dateIsoValide(bDebut) ||
    !dateIsoValide(bFin)
  ) {
    throw new Error("Dates invalides pour le calcul de chevauchement.");
  }
  return aDebut < bFin && bDebut < aFin;
}

export function sejourValide(debut: string, fin: string): boolean {
  return dateIsoValide(debut) && dateIsoValide(fin) && debut < fin;
}

export function nuitsSejour(debut: string, fin: string): number {
  if (!sejourValide(debut, fin)) {
    throw new Error("Séjour invalide.");
  }
  const ms =
    Date.parse(`${fin}T00:00:00.000Z`) -
    Date.parse(`${debut}T00:00:00.000Z`);
  return Math.round(ms / (24 * 60 * 60 * 1000));
}
