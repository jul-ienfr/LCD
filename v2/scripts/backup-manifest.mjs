export const CLES_COMPTES = [
  "tenants",
  "users",
  "logements",
  "reservations",
  "factures",
  "paiements",
  "blocages",
  "tables",
  "migrations",
];

export function normaliserComptes(ligne) {
  const valeurs = String(ligne ?? "")
    .trim()
    .split(",")
    .map(Number);
  return Object.fromEntries(
    CLES_COMPTES.map((cle, index) => [cle, valeurs[index] ?? 0]),
  );
}

/** Retourne les écarts lisibles entre les comptes attendus et restaurés. */
export function comparerComptes(attendus, obtenus) {
  const ecarts = [];
  for (const cle of CLES_COMPTES) {
    const attendu = Number(attendus?.[cle] ?? 0);
    const obtenu = Number(obtenus?.[cle] ?? 0);
    if (attendu !== obtenu) {
      ecarts.push(`${cle}: attendu ${attendu}, obtenu ${obtenu}`);
    }
  }
  return ecarts;
}
