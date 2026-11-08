export function texte(
  contenu: Record<string, unknown>,
  cle: string,
  repli = "",
): string {
  const valeur = contenu[cle];
  return typeof valeur === "string" && valeur.trim() ? valeur.trim() : repli;
}

export function tableau(
  contenu: Record<string, unknown>,
  cle: string,
): unknown[] {
  const valeur = contenu[cle];
  return Array.isArray(valeur) ? valeur : [];
}

export function objet(
  valeur: unknown,
): Record<string, unknown> | null {
  return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur)
    ? (valeur as Record<string, unknown>)
    : null;
}

export function texteDe(
  valeur: unknown,
  cle: string,
  repli = "",
): string {
  const record = objet(valeur);
  return record ? texte(record, cle, repli) : repli;
}
