/**
 * US8 (T804) — Règles pures du mode démonstration.
 *
 * Un tenant `lecture_seule` sert à montrer le produit sans risque : toutes les
 * lectures restent possibles, toutes les écritures authentifiées sont
 * refusées. Les routes d'authentification et l'aperçu restent exemptés pour
 * permettre la connexion et la sortie.
 */
export const METHODES_LECTURE = ["GET", "HEAD", "OPTIONS"] as const;

export function estMethodeLecture(methode: string): boolean {
  return (METHODES_LECTURE as readonly string[]).includes(
    methode.toUpperCase(),
  );
}

export function cheminEcritureExempte(chemin: string): boolean {
  return (
    chemin.startsWith("/api/auth/") ||
    chemin.startsWith("/preview/") ||
    chemin === "/login" ||
    chemin === "/two-factor"
  );
}

export function doitBloquerEcriture(input: {
  methode: string;
  chemin: string;
  lectureSeule: boolean;
}): boolean {
  if (!input.lectureSeule) return false;
  if (estMethodeLecture(input.methode)) return false;
  return !cheminEcritureExempte(input.chemin);
}
