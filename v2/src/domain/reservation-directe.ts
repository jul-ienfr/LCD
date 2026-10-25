import { ajouterJours, dateIsoValide } from "./calendrier";
import { ErreurMetier } from "./erreurs";
import { nuitsSejour, sejourValide } from "./planning";

export type TarifNuit = { date: string; prixCentimes: number };

export type DevisDirect = {
  nuits: number;
  totalCentimes: number;
  lignes: TarifNuit[];
};

export function devisDirect(
  debut: string,
  fin: string,
  tarifs: readonly TarifNuit[],
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
  for (const tarif of tarifs) {
    if (
      !dateIsoValide(tarif.date) ||
      !Number.isInteger(tarif.prixCentimes) ||
      tarif.prixCentimes < 0
    ) {
      throw new ErreurMetier("PRIX_INVALIDE", "Tarif invalide.");
    }
    parDate.set(tarif.date, tarif.prixCentimes);
  }

  const lignes: TarifNuit[] = [];
  const manquants: string[] = [];
  let date = debut;
  while (date < fin) {
    const prix = parDate.get(date);
    if (prix === undefined) manquants.push(date);
    else lignes.push({ date, prixCentimes: prix });
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
    totalCentimes: lignes.reduce((total, l) => total + l.prixCentimes, 0),
    lignes,
  };
}

export function referenceDirecte(aleatoire: string): string {
  const code = aleatoire.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12).toUpperCase();
  return `DIR-${code}`;
}
