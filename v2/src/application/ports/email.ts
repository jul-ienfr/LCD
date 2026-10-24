export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

/**
 * Port d'envoi d'email. Implémentations : Brevo, Postmark, SMTP,
 * ou un transport mémoire en test.
 */
export interface EmailSender {
  envoyer(message: EmailMessage): Promise<void>;
}
