/**
 * T110 — calcul des différences ARI entre l'état local désiré et l'état
 * distant. Le but est de ne pousser que les jours réellement modifiés, sans
 * jamais omettre un jour absent de la réponse distante.
 */

export interface DisponibiliteAri {
  externalPropertyId: string;
  externalRoomTypeId?: string | null;
  date: string;
  disponible: boolean;
}

export interface TarifAri {
  externalPropertyId: string;
  externalRoomTypeId?: string | null;
  externalRatePlanId?: string | null;
  date: string;
  prixCentimes: number;
  devise: string;
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

function cle(entree: {
  externalPropertyId: string;
  externalRoomTypeId?: string | null;
  externalRatePlanId?: string | null;
  date: string;
}): string {
  return [
    entree.externalPropertyId,
    entree.externalRoomTypeId ?? "",
    entree.externalRatePlanId ?? "",
    entree.date,
  ].join("|");
}

function sansDifference<T>(
  desirees: readonly T[],
  distantes: readonly T[],
  extraireCle: (entree: T) => string,
  equivalentes: (desiree: T, distante: T) => boolean,
): T[] {
  const parCle = new Map(distantes.map((entree) => [extraireCle(entree), entree]));
  return desirees.filter((desiree) => {
    const distante = parCle.get(extraireCle(desiree));
    return !distante || !equivalentes(desiree, distante);
  });
}

export function disponibilitesDifferentes(
  desirees: readonly DisponibiliteAri[],
  distantes: readonly DisponibiliteAri[],
): DisponibiliteAri[] {
  return sansDifference(desirees, distantes, cle, (a, b) => a.disponible === b.disponible);
}

export function tarifsDifferents(
  desirees: readonly TarifAri[],
  distants: readonly TarifAri[],
): TarifAri[] {
  return sansDifference(
    desirees,
    distants,
    cle,
    (a, b) => a.prixCentimes === b.prixCentimes && a.devise === b.devise,
  );
}

function normaliserRestriction(entree: RestrictionAri): string {
  return JSON.stringify({
    sejourMin: entree.sejourMin ?? null,
    sejourMax: entree.sejourMax ?? null,
    arriveeAutorisee: entree.arriveeAutorisee ?? null,
    departAutorisee: entree.departAutorisee ?? null,
    stopSell: entree.stopSell ?? null,
  });
}

export function restrictionsDifferentes(
  desirees: readonly RestrictionAri[],
  distantes: readonly RestrictionAri[],
): RestrictionAri[] {
  return sansDifference(
    desirees,
    distantes,
    cle,
    (a, b) => normaliserRestriction(a) === normaliserRestriction(b),
  );
}
