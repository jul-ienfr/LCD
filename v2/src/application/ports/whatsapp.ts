export interface WhatsAppMessage {
  to: string;
  text: string;
}

export interface WhatsAppEnvoi {
  externalId: string | null;
}

/**
 * Port d'envoi WhatsApp Business Cloud. L'adapter confiné vérifie le numéro et
 * n'expose jamais le jeton. Hors fenêtre de service de 24 h, WhatsApp exige un
 * modèle approuvé : l'appelant doit alors utiliser un template côté fournisseur.
 */
export interface WhatsAppSender {
  envoyer(message: WhatsAppMessage): Promise<WhatsAppEnvoi>;
}
