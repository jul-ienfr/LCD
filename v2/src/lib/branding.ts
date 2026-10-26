/**
 * Marque affichable côté client. Lue à chaque requête pour permettre un
 * re-thème par environnement sans rebuild (marque blanche). Les identifiants
 * internes (cookies, refs, en-têtes) restent stables et ne passent pas ici.
 */
export function marque(): string {
  return (
    process.env.MARQUE?.trim() ||
    process.env.LCD_MARQUE?.trim() ||
    "LCD Parc"
  );
}

export function marqueCourte(): string {
  return (
    process.env.MARQUE_COURTE?.trim() ||
    process.env.LCD_MARQUE_COURTE?.trim() ||
    marque()
  );
}

export function slugMarque(): string {
  const brut =
    process.env.MARQUE_SLUG?.trim() || process.env.LCD_MARQUE_SLUG?.trim();
  if (brut) return brut;
  return (
    marque()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "sejour"
  );
}
