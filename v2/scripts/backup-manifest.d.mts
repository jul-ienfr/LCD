export const CLES_COMPTES: string[];
export function normaliserComptes(
  ligne: string | undefined,
): Record<string, number>;
export function comparerComptes(
  attendus: Record<string, number> | undefined,
  obtenus: Record<string, number> | undefined,
): string[];
