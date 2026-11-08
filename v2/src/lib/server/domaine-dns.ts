import { resolveTxt } from "node:dns/promises";

const DELAI_MS = 5_000;

/**
 * Vérifie l'enregistrement TXT `_lcd-verification.<domaine>`.
 * Échoue fermé : timeout, NXDOMAIN ou erreur DNS => false.
 */
export async function verifierDnsTxt(
  domaine: string,
  token: string,
): Promise<boolean> {
  const requete = resolveTxt(`_lcd-verification.${domaine}`).catch(() => []);
  const resultat = await Promise.race([
    requete,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), DELAI_MS)),
  ]);
  if (!resultat) return false;
  return resultat.some((morceaux) => morceaux.join("").trim() === token);
}
