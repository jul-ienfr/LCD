export type CodeErreurMetier =
  | "CODE_INVALIDE"
  | "NOM_INVALIDE"
  | "LOGEMENT_DEJA_EXISTANT"
  | "LOGEMENT_INTROUVABLE"
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
  | "EMAIL_INVALIDE"
  | "IMPORT_ICS_INVALIDE"
  | "FLUX_ICS_INVALIDE"
  | "WEBHOOK_INVALIDE"
  | "CAUTION_INVALIDE"
  | "UTILISATEUR_INVALIDE"
  | "DESIGN_INVALIDE"
  | "STOCK_INVALIDE"
  | "INVENTAIRE_INVALIDE"
  | "TOURISME_INVALIDE"
  | "MEMOIRE_INVALIDE"
  | "AVIS_INVALIDE"
  | "ETAT_DES_LIEUX_INVALIDE"
  | "ENTRETIEN_INVALIDE"
  | "MENAGE_INVALIDE"
  | "CONTRAT_INVALIDE"
  | "QUESTIONNAIRE_INVALIDE"
  | "PHRASE_INVALIDE"
  | "FORMATION_INVALIDE"
  | "OBJET_TROUVE_INVALIDE"
  | "TARIF_MANQUANT";

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
