import type { TenantId } from "./tenant";

export type LogementId = string;
export type StatutLogement = "actif" | "inactif" | "archive";

export interface Logement {
  id: LogementId;
  tenantId: TenantId;
  code: string;
  nom: string;
  adresse?: string;
  statut: StatutLogement;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Code logement : 2 à 32 caractères, minuscules, chiffres, tirets.
 * Il est stable : il sert dans les URLs, les exports et les refs idempotentes.
 */
export function codeLogementValide(code: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/.test(code);
}

export function nomLogementValide(nom: string): boolean {
  return nom.trim().length >= 2 && nom.trim().length <= 120;
}
