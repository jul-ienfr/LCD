export type CodeErreurMetier =
  | "CODE_INVALIDE"
  | "NOM_INVALIDE"
  | "LOGEMENT_DEJA_EXISTANT"
  | "TENANT_INVALIDE"
  | "NON_AUTORISE"
  | "DATE_INVALIDE"
  | "PRIX_INVALIDE"
  | "REF_INVALIDE"
  | "VOYAGEURS_INVALIDE"
  | "RESERVATION_CHEVAUCHE"
  | "FACTURE_INVALIDE"
  | "INCIDENT_INVALIDE"
  | "RESERVATION_INTROUVABLE"
  | "MISSION_INVALIDE"
  | "PROSPECT_INVALIDE"
  | "OFFRE_INVALIDE"
  | "TICKET_INVALIDE"
  | "EXTRA_INVALIDE"
  | "FISCALITE_INVALIDE"
  | "PAIEMENT_INVALIDE"
  | "EMAIL_INVALIDE";

/**
 * Erreur métier : porte un code stable, indépendant du framework HTTP.
 * L'app Next la traduit en 400/403/409 sans que le domaine connaisse HTTP.
 */
export class ErreurMetier extends Error {
  constructor(
    public readonly code: CodeErreurMetier,
    message: string,
  ) {
    super(message);
    this.name = "ErreurMetier";
  }
}
