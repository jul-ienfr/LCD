import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

/**
 * Confirmation des actions destructrices (FR-039, spec 006).
 *
 * Toute action qui détruit une donnée ou révoque un accès passe par un flux
 * serveur en deux étapes : un premier geste ne supprime rien, il renvoie vers
 * la page avec `?confirmer=<action>&cible=<élément>` ; la page affiche alors
 * la question de confirmation, et seul le second envoi (formulaire POST portant
 * `confirmation=<action>`) exécute l'action. Ce module porte les quelques mots
 * communs à toutes ces confirmations ; le libellé propre à l'action vient du
 * dictionnaire de la page (« Supprimer », « Révoquer », ...).
 */
export interface TraductionsConfirmation {
  /** Titre de la zone de confirmation. */
  titre: string;
  /** Question posée, construite à partir du libellé de l'action. */
  question: (action: string) => string;
  /** Rappel que l'action est définitive. */
  aide: string;
  confirmer: string;
  annuler: string;
}

const FR: TraductionsConfirmation = {
  titre: "Confirmation requise",
  question: (action) => `Confirmer « ${action} » ?`,
  aide: "Cette action est définitive : elle ne peut pas être annulée.",
  confirmer: "Confirmer",
  annuler: "Annuler",
};

const EN: TraductionsConfirmation = {
  titre: "Confirmation required",
  question: (action) => `Confirm “${action}”?`,
  aide: "This action is permanent and cannot be undone.",
  confirmer: "Confirm",
  annuler: "Cancel",
};

const ES: TraductionsConfirmation = {
  titre: "Confirmación necesaria",
  question: (action) => `¿Confirmar «${action}»?`,
  aide: "Esta acción es definitiva: no se puede deshacer.",
  confirmer: "Confirmar",
  annuler: "Cancelar",
};

const IT: TraductionsConfirmation = {
  titre: "Conferma necessaria",
  question: (action) => `Confermare «${action}»?`,
  aide: "Questa azione è definitiva: non può essere annullata.",
  confirmer: "Conferma",
  annuler: "Annulla",
};

const DE: TraductionsConfirmation = {
  titre: "Bestätigung erforderlich",
  question: (action) => `${action} wirklich bestätigen?`,
  aide: "Diese Aktion ist endgültig und kann nicht rückgängig gemacht werden.",
  confirmer: "Bestätigen",
  annuler: "Abbrechen",
};

const DICTIONNAIRES: Record<Langue, TraductionsConfirmation> = {
  fr: FR,
  en: EN,
  es: ES,
  it: IT,
  de: DE,
};

export function traductionsConfirmation(
  langue: string | null | undefined,
): TraductionsConfirmation {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
