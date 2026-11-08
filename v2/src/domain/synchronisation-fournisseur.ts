import { ajouterJours, dateIsoValide } from "./calendrier";

export interface OccupationAri {
  debut: string;
  fin: string;
}

export interface TarifAri {
  date: string;
  prixCentimes: number;
}

export interface RestrictionSource {
  date: string;
  sejourMin: number | null;
  sejourMax: number | null;
  arriveeAutorisee: boolean | null;
  departAutorisee: boolean | null;
  stopSell: boolean | null;
}

export interface RestrictionAri {
  externalPropertyId: string;
  externalRoomTypeId?: string | null;
  externalRatePlanId?: string | null;
  date: string;
  sejourMin?: number;
  sejourMax?: number;
  arriveeAutorisee?: boolean;
  departAutorisee?: boolean;
  stopSell?: boolean;
}

export interface JourDisponibiliteAri {
  date: string;
  disponible: boolean;
  prixCentimes: number | null;
}

export interface CalendrierAri {
  debut: string;
  fin: string;
  disponibilites: JourDisponibiliteAri[];
  tarifs: TarifAri[];
}

/**
 * Construit un calendrier ARI minimal à partir des occupations locales.
 * La fin est exclusive, comme dans le reste de la V2.
 */
export function construireCalendrierAri(input: {
  debut: string;
  fin: string;
  occupations: readonly OccupationAri[];
  tarifs: readonly TarifAri[];
  cutoffJours?: number;
  bufferJours?: number;
}): CalendrierAri {
  if (
    !dateIsoValide(input.debut) ||
    !dateIsoValide(input.fin) ||
    input.debut >= input.fin
  ) {
    throw new Error("Période ARI invalide.");
  }

  const bufferJours = Math.max(0, Math.min(7, input.bufferJours ?? 0));
  const occupes = new Set<string>();
  for (const occupation of input.occupations) {
    if (
      !dateIsoValide(occupation.debut) ||
      !dateIsoValide(occupation.fin) ||
      occupation.debut >= occupation.fin
    ) {
      continue;
    }
    const debut = occupation.debut < input.debut ? input.debut : occupation.debut;
    const fin = occupation.fin > input.fin ? input.fin : occupation.fin;
    const finAvecBuffer =
      bufferJours > 0 && fin < input.fin
        ? ajouterJours(fin, bufferJours)
        : fin;
    const finLimite = finAvecBuffer > input.fin ? input.fin : finAvecBuffer;
    for (let date = debut; date < finLimite; date = ajouterJours(date, 1)) {
      occupes.add(date);
    }
  }

  const tarifsParDate = new Map<string, number>();
  for (const tarif of input.tarifs) {
    if (
      tarif.date >= input.debut &&
      tarif.date < input.fin &&
      dateIsoValide(tarif.date) &&
      Number.isInteger(tarif.prixCentimes) &&
      tarif.prixCentimes > 0
    ) {
      tarifsParDate.set(tarif.date, tarif.prixCentimes);
    }
  }

  const cutoffJours = Math.max(0, input.cutoffJours ?? 0);
  const limiteCutoff =
    cutoffJours > 0 ? ajouterJours(input.debut, cutoffJours) : input.debut;
  const disponibilites: JourDisponibiliteAri[] = [];
  for (let date = input.debut; date < input.fin; date = ajouterJours(date, 1)) {
    disponibilites.push({
      date,
      disponible: date >= limiteCutoff && !occupes.has(date),
      prixCentimes: tarifsParDate.get(date) ?? null,
    });
  }

  return {
    debut: input.debut,
    fin: input.fin,
    disponibilites,
    tarifs: [...tarifsParDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, prixCentimes]) => ({ date, prixCentimes })),
  };
}

export function construireRestrictionsAri(input: {
  debut: string;
  fin: string;
  restrictions: readonly RestrictionSource[];
  externalPropertyId: string;
  externalRoomTypeId?: string | null;
  externalRatePlanId?: string | null;
}): RestrictionAri[] {
  const resultat: RestrictionAri[] = [];
  for (const restriction of input.restrictions) {
    if (restriction.date < input.debut || restriction.date >= input.fin) {
      continue;
    }
    if (
      restriction.sejourMin === null &&
      restriction.sejourMax === null &&
      restriction.arriveeAutorisee === null &&
      restriction.departAutorisee === null &&
      restriction.stopSell === null
    ) {
      continue;
    }
    const sortie: RestrictionAri = {
      externalPropertyId: input.externalPropertyId,
      externalRoomTypeId: input.externalRoomTypeId,
      externalRatePlanId: input.externalRatePlanId,
      date: restriction.date,
    };
    if (restriction.sejourMin !== null) sortie.sejourMin = restriction.sejourMin;
    if (restriction.sejourMax !== null) sortie.sejourMax = restriction.sejourMax;
    if (restriction.arriveeAutorisee !== null) {
      sortie.arriveeAutorisee = restriction.arriveeAutorisee;
    }
    if (restriction.departAutorisee !== null) {
      sortie.departAutorisee = restriction.departAutorisee;
    }
    if (restriction.stopSell !== null) {
      sortie.stopSell = restriction.stopSell;
    }
    resultat.push(sortie);
  }
  return resultat.sort((a, b) => a.date.localeCompare(b.date));
}
