export function formaterEuros(centimes: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(centimes / 100);
}

export function formaterOctets(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  const mo = octets / (1024 * 1024);
  if (mo < 1024) return `${mo.toFixed(1)} Mo`;
  return `${(mo / 1024).toFixed(2)} Go`;
}

/** Accepte "120", "120,50" et "120.50". Retourne des centimes ou null. */
export function centimesDepuisSaisie(valeur: string): number | null {
  const normalise = valeur.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalise) return null;
  const nombre = Number(normalise);
  if (!Number.isFinite(nombre) || nombre < 0) return null;
  const centimes = Math.round(nombre * 100);
  return Number.isInteger(centimes) ? centimes : null;
}
