export interface EmailAttachment {
  filename: string;
  content: Uint8Array;
  contentType?: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

/**
 * Port d'envoi d'email. Implémentations : Brevo, Postmark, SMTP,
 * ou un transport mémoire en test.
 */
export interface EmailSender {
  envoyer(message: EmailMessage): Promise<void>;
}
