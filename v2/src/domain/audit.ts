const LIBELLES_ACTION_AUDIT: Record<string, string> = {
  "caution.creer": "Caution créée",
  "caution.statut": "Caution mise à jour",
  "commande_extra.creer": "Commande extra créée",
  "commande_extra.statut": "Commande extra mise à jour",
  "design.site": "Design du site modifié",
  "extra.creer": "Extra créé",
  "entite.mettre_a_jour": "Entité juridique mise à jour",
  "facture.creer": "Facture créée",
  "facture.email": "Facture envoyée",
  "facture.statut": "Statut de facture modifié",
  "fiscalite.parametres": "Paramètres fiscaux modifiés",
  "flux_ics.enregistrer": "Flux ICS enregistré",
  "flux_ics.supprimer": "Flux ICS supprimé",
  "flux_ics.sync": "Flux ICS synchronisé",
  "logement.creer": "Logement créé",
  "logement.guide": "Guide du logement mis à jour",
  "mission.creer": "Mission créée",
  "mission.statut": "Statut de mission modifié",
  "offre.creer": "Offre créée",
  "offre.statut": "Statut d’offre modifié",
  "objet.trouver": "Objet trouvé enregistré",
  "objet.reclamer": "Objet trouvé réclamé",
  "objet.envoyer": "Objet trouvé envoyé",
  "objet.donner": "Objet trouvé donné ou remis au stock",
  "paiement.creer": "Paiement enregistré",
  "paiement.stripe": "Paiement Stripe enregistré",
  "planning.import_ics": "Import ICS effectué",
  "proprietaire.assigner": "Propriétaire rattaché",
  "proprietaire.retirer": "Propriétaire retiré",
  "prospect.creer": "Prospect créé",
  "prospect.statut": "Statut de prospect modifié",
  "reservation.creer": "Réservation créée",
  "reservation.demande": "Demande de réservation directe",
  "memoire.optin": "Mémoire voyageur activée",
  "memoire.optout": "Mémoire voyageur effacée",
  "avis.creer": "Avis voyageur déposé",
  "avis.moderation": "Avis modéré",
  "stock.consommer": "Rotation de consommables consommée",
  "stock.enregistrer": "Consommable enregistré",
  "stock.reassort": "Réassort de consommables enregistré",
  "inventaire.enregistrer": "Bien d’inventaire enregistré",
  "inventaire.utiliser": "Bien d’inventaire utilisé",
  "inventaire.etat": "État d’un bien d’inventaire modifié",
  "tourisme.enregistrer": "Lieu touristique enregistré",
  "tourisme.desactiver": "Lieu touristique désactivé",
  "tarif.definir": "Tarif défini",
  "ticket.creer": "Ticket créé",
  "ticket.message": "Message support ajouté",
  "ticket.statut": "Statut de ticket modifié",
  "annonce.enregistrer": "Conformité d’annonce mise à jour",
  "rgpd.enregistrer": "Registre RGPD mis à jour",
  "sinistre.declarer": "Sinistre déclaré",
  "sinistre.statut": "Statut de sinistre mis à jour",
  "dispatch.proposer": "Mission proposée à un prestataire",
  "dispatch.repondre": "Réponse du prestataire à une offre",
  "dispatch.retirer": "Offre de mission retirée",
  "message.preparer": "Message voyageur préparé",
  "message.envoyer": "Message voyageur envoyé",
  "preferences.enregistrer": "Préférences de séjour enregistrées",
  "acces.revoquer": "Session révoquée",
  "menage.evaluer": "Rotation de ménage évaluée",
  "assistant.enregistrer": "Brouillon assistant enregistré",
  "tranquillite.preuve": "Preuve de tranquillité enregistrée",
  "tranquillite.supprimer": "Preuve de tranquillité supprimée",
  "tenant.export": "Export complet des données",
  "audit.purger": "Journal d’audit purgé",
  "utilisateur.activer": "Utilisateur réactivé",
  "utilisateur.creer": "Utilisateur créé",
  "utilisateur.desactiver": "Utilisateur désactivé",
  "utilisateur.motdepasse": "Mot de passe réinitialisé",
  "utilisateur.2fa": "Double authentification réinitialisée",
  "utilisateur.role": "Rôle modifié",
  "webhook.enregistrer": "Webhook enregistré",
  "webhook.supprimer": "Webhook supprimé",
};

export function libelleActionAudit(action: string): string {
  return LIBELLES_ACTION_AUDIT[action] ?? action;
}

export const JOURS_AUDIT: readonly number[] = [7, 30, 90];
export const JOURS_AUDIT_DEFAUT = 90;

export function joursAuditValide(jours: number): boolean {
  return (JOURS_AUDIT as readonly number[]).includes(jours);
}

export function depuisJours(jours: number, maintenant = new Date()): Date {
  return new Date(maintenant.getTime() - jours * 24 * 60 * 60 * 1000);
}

export const FAMILLES_AUDIT = [
  "utilisateur",
  "reservation",
  "paiement",
  "facture",
  "caution",
  "mission",
  "ticket",
  "menage",
  "message",
  "dispatch",
  "assistant",
  "stock",
  "logement",
  "avis",
] as const;

export type FamilleAudit = (typeof FAMILLES_AUDIT)[number];

export const LIBELLES_FAMILLE_AUDIT: Record<FamilleAudit, string> = {
  utilisateur: "Utilisateurs",
  reservation: "Réservations",
  paiement: "Paiements",
  facture: "Factures",
  caution: "Cautions",
  mission: "Missions",
  ticket: "Support",
  menage: "Ménage",
  message: "Messages",
  dispatch: "Dispatch",
  assistant: "Assistant",
  stock: "Stocks",
  logement: "Logements",
  avis: "Avis",
};

export function familleAuditValide(
  valeur: string,
): valeur is FamilleAudit {
  return (FAMILLES_AUDIT as readonly string[]).includes(valeur);
}

export const RETENTION_AUDIT_MIN_JOURS = 365;
export const RETENTION_AUDIT_DEFAUT_JOURS = 1825;
export const CONFIRMATION_PURGE_AUDIT = "PURGER";

export function joursRetentionValide(jours: number): boolean {
  return (
    Number.isInteger(jours) &&
    jours >= RETENTION_AUDIT_MIN_JOURS &&
    jours <= 36_500
  );
}

export function dateLimiteRetention(
  jours: number,
  maintenant = new Date(),
): Date {
  return new Date(maintenant.getTime() - jours * 24 * 60 * 60 * 1000);
}

export function confirmationPurgeValide(valeur: string): boolean {
  return valeur.trim() === CONFIRMATION_PURGE_AUDIT;
}
