export const RTO_MAX_MINUTES: number;
export const RPO_MAX_HEURES: number;

export function evaluerObjectifs(entree: {
  dureeMs: number;
  ageSauvegardeHeures: number;
  rtoMaxMinutes?: number;
  rpoMaxHeures?: number;
}): { rtoConforme: boolean; rpoConforme: boolean; conforme: boolean };

export function construirePreuveRestauration(entree: {
  fichier: string | null;
  demarreLe: string;
  dureeMs: number;
  ageSauvegardeHeures: number | null;
  comptes: object | null;
  ok: boolean;
  erreur: string | null;
  rtoMaxMinutes?: number;
  rpoMaxHeures?: number;
}): Record<string, unknown>;
