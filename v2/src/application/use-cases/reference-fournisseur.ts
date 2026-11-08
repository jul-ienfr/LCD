import { createHash } from "node:crypto";
import type { CodeFournisseur } from "@/domain/fournisseur";

/**
 * Référence locale stable d'une réservation OTA.
 *
 * Elle est volontairement déterministe : deux imports du même `externalId`
 * produisent la même `ref`, ce qui rend l'import idempotent et permet à la
 * réconciliation de retrouver la ligne locale sans table de correspondance.
 */
export function referenceReservationFournisseur(
  code: CodeFournisseur,
  externalId: string,
): string {
  const brut = `fournisseur:${code}:${externalId}`;
  if (brut.length <= 64) return brut;
  return `fournisseur:${code}:${createHash("sha256")
    .update(externalId)
    .digest("hex")
    .slice(0, 40)}`;
}
