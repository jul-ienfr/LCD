import { ajouterJours } from "./calendrier";
import { BUFFER_MAX_JOURS, bufferJoursValide } from "./canal";
import type { EvenementIcs } from "./ics-export";

export function appliquerBuffer(
  evenements: readonly EvenementIcs[],
  bufferJours: number,
): EvenementIcs[] {
  if (!bufferJoursValide(bufferJours)) {
    throw new Error(
      `Le buffer doit être un entier entre 0 et ${BUFFER_MAX_JOURS} jours.`,
    );
  }
  if (bufferJours === 0) return evenements.map((evenement) => ({ ...evenement }));
  return evenements.map((evenement) => ({
    ...evenement,
    fin: ajouterJours(evenement.fin, bufferJours),
  }));
}

export function exclureFlux<T extends { fluxIcsId: string | null }>(
  elements: readonly T[],
  fluxIcsId: string | null,
): T[] {
  if (!fluxIcsId) return [...elements];
  return elements.filter((element) => element.fluxIcsId !== fluxIcsId);
}
