const DEBUT_FORMULE = /^[=+\-@\t\r]/u;

/**
 * Cellule CSV sûre pour Excel/LibreOffice.
 *
 * Le guillemet seul n'empêche pas l'évaluation d'une formule : une valeur
 * contrôlée par un client (`=HYPERLINK(...)`, `+cmd`, `@SUM`, etc.) doit être
 * préfixée par une apostrophe. Les guillemets internes sont doublés.
 */
export function celluleCsv(valeur: unknown): string {
  let texte = String(valeur ?? "");
  if (DEBUT_FORMULE.test(texte.trimStart())) {
    texte = `'${texte}`;
  }
  return `"${texte.replace(/"/gu, '""')}"`;
}
