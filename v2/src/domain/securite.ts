const ROLES_DEUX_FACTEURS = new Set([
  "super_admin",
  "admin",
  "hote",
  "comptable",
  "operateur",
]);

export function deuxFacteursRequis(
  role: string,
  deuxFacteursActifs: boolean,
  obligationActive: boolean,
): boolean {
  return (
    obligationActive &&
    ROLES_DEUX_FACTEURS.has(role) &&
    !deuxFacteursActifs
  );
}
