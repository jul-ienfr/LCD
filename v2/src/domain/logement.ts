import type { TenantId } from "./tenant";

export type LogementId = string;
export type StatutLogement = "actif" | "inactif" | "archive";

export interface Logement {
  id: LogementId;
  tenantId: TenantId;
  code: string;
  nom: string;
  adresse?: string;
  checkinHeure?: string;
  checkinInstructions?: string;
  wifiSsid?: string;
  wifiPassword?: string;
  regles?: string;
  urgenceTel?: string;
  guideTexte?: string;
  coproVerifiee: boolean;
  coproVerifieeLe?: Date;
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

/**
 * Un logement n'est proposé aux voyageurs que s'il est actif et si le
 * règlement de copropriété / l'accord du syndic a été vérifié. Tant que la
 * vérification n'est pas faite, la mise en ligne est bloquée (REQ-L-001).
 */
export function logementPubliable(
  logement: Pick<Logement, "statut" | "coproVerifiee">,
): boolean {
  return logement.statut === "actif" && logement.coproVerifiee;
}
