import { ajouterJours, dateIsoValide } from "./calendrier";
import { ErreurMetier } from "./erreurs";
import { nuitsSejour, sejourValide } from "./planning";

export type TarifNuit = {
  date: string;
  prixCentimes: number;
  /** Supplément par personne au-delà des personnes incluses. */
  prixParPersonneCentimes?: number;
  /** Occupants sans supplément pour cette nuit (défaut 2). */
  personnesIncluses?: number;
};

export type DevisDirect = {
  nuits: number;
  totalCentimes: number;
  supplementPersonnesCentimes: number;
  lignes: TarifNuit[];
};

export interface ParametresDevis {
  voyageurs?: number;
  /** Occupants sans supplément (2 par défaut). */
  personnesIncluses?: number;
}

export function devisDirect(
  debut: string,
  fin: string,
  tarifs: readonly TarifNuit[],
  parametres: ParametresDevis = {},
): DevisDirect {
  if (!sejourValide(debut, fin)) {
    throw new ErreurMetier(
      "DATE_INVALIDE",
      "Les dates du séjour sont invalides (fin exclusive).",
    );
  }
  if (nuitsSejour(debut, fin) > 60) {
    throw new ErreurMetier(
      "DATE_INVALIDE",
      "Un séjour direct est limité à 60 nuits.",
    );
  }

  const parDate = new Map<string, number>();
  const parPersonne = new Map<string, number>();
  const inclusesParDate = new Map<string, number>();
  const voyageurs = parametres.voyageurs ?? 1;
  const personnesInclusesDefaut = parametres.personnesIncluses ?? 2;
  if (!Number.isInteger(voyageurs) || voyageurs < 1 || voyageurs > 20) {
    throw new ErreurMetier(
      "VOYAGEURS_INVALIDE",
      "Le nombre de voyageurs doit être entre 1 et 20.",
    );
  }
  if (!Number.isInteger(personnesInclusesDefaut) || personnesInclusesDefaut < 0) {
    throw new ErreurMetier(
      "PRIX_INVALIDE",
      "Le nombre de personnes incluses est invalide.",
    );
  }

  for (const tarif of tarifs) {
    if (
      !dateIsoValide(tarif.date) ||
      !Number.isInteger(tarif.prixCentimes) ||
      tarif.prixCentimes < 0
    ) {
      throw new ErreurMetier("PRIX_INVALIDE", "Tarif invalide.");
    }
    if (
      tarif.prixParPersonneCentimes !== undefined &&
      (!Number.isInteger(tarif.prixParPersonneCentimes) ||
        tarif.prixParPersonneCentimes < 0)
    ) {
      throw new ErreurMetier(
        "PRIX_INVALIDE",
        "Supplément par personne invalide.",
      );
    }
    if (
      tarif.personnesIncluses !== undefined &&
      (!Number.isInteger(tarif.personnesIncluses) ||
        tarif.personnesIncluses < 0 ||
        tarif.personnesIncluses > 20)
    ) {
      throw new ErreurMetier(
        "PRIX_INVALIDE",
        "Nombre de personnes incluses invalide.",
      );
    }
    parDate.set(tarif.date, tarif.prixCentimes);
    if (tarif.prixParPersonneCentimes !== undefined) {
      parPersonne.set(tarif.date, tarif.prixParPersonneCentimes);
    }
    inclusesParDate.set(
      tarif.date,
      tarif.personnesIncluses ?? personnesInclusesDefaut,
    );
  }

  const lignes: TarifNuit[] = [];
  const manquants: string[] = [];
  let supplementPersonnesCentimes = 0;
  let date = debut;
  while (date < fin) {
    const prix = parDate.get(date);
    if (prix === undefined) manquants.push(date);
    else {
      const incluses = inclusesParDate.get(date) ?? personnesInclusesDefaut;
      supplementPersonnesCentimes +=
        (parPersonne.get(date) ?? 0) * Math.max(0, voyageurs - incluses);
      lignes.push({ date, prixCentimes: prix });
    }
    date = ajouterJours(date, 1);
  }

  if (manquants.length > 0) {
    throw new ErreurMetier(
      "TARIF_MANQUANT",
      `Aucun tarif pour : ${manquants.slice(0, 5).join(", ")}${
        manquants.length > 5 ? "…" : ""
      }.`,
    );
  }

  return {
    nuits: lignes.length,
    totalCentimes:
      lignes.reduce((total, l) => total + l.prixCentimes, 0) +
      supplementPersonnesCentimes,
    supplementPersonnesCentimes,
    lignes,
  };
}

export function referenceDirecte(aleatoire: string): string {
  const code = aleatoire.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12).toUpperCase();
  return `DIR-${code}`;
}
