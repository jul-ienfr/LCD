// Calculs de prix : purs, déterministes, testables sans DB.
// Tous les montants sont en centimes d'euro (entiers) pour éviter les flottants.

export type Centimes = number;

const JOUR_MS = 24 * 60 * 60 * 1000;

function parseDateUtc(date: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Date invalide (attendu AAAA-MM-JJ) : ${date}`);
  }
  const ms = Date.parse(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(ms)) throw new Error(`Date invalide : ${date}`);
  return ms;
}

/** Nombre de nuits entre deux dates AAAA-MM-JJ (fin exclusive). */
export function nuitsEntre(debut: string, fin: string): number {
  const d = parseDateUtc(debut);
  const f = parseDateUtc(fin);
  const nuits = Math.round((f - d) / JOUR_MS);
  if (nuits <= 0) {
    throw new Error("La date de fin doit être après la date de début.");
  }
  return nuits;
}

export interface PrixSejour {
  prixNuitCentimes: Centimes;
  nuits: number;
  extrasCentimes?: Centimes;
  taxeSejourCentimes?: Centimes;
  remiseCentimes?: Centimes;
}

/**
 * Prix total TTC d'un séjour.
 * La taxe de séjour est ajoutée au total mais suivie séparément en compta.
 */
export function prixSejour({
  prixNuitCentimes,
  nuits,
  extrasCentimes = 0,
  taxeSejourCentimes = 0,
  remiseCentimes = 0,
}: PrixSejour): Centimes {
  if (!Number.isInteger(prixNuitCentimes) || prixNuitCentimes < 0) {
    throw new Error("prixNuitCentimes doit être un entier positif.");
  }
  if (!Number.isInteger(nuits) || nuits <= 0) {
    throw new Error("nuits doit être un entier strictement positif.");
  }
  for (const [nom, valeur] of [
    ["extrasCentimes", extrasCentimes],
    ["taxeSejourCentimes", taxeSejourCentimes],
    ["remiseCentimes", remiseCentimes],
  ] as const) {
    if (!Number.isInteger(valeur) || valeur < 0) {
      throw new Error(`${nom} doit être un entier positif.`);
    }
  }

  const total =
    prixNuitCentimes * nuits +
    extrasCentimes +
    taxeSejourCentimes -
    remiseCentimes;

  if (total < 0) throw new Error("Le total ne peut pas être négatif.");
  return total;
}
