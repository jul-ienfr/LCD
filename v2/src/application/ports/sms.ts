export interface SmsMessage {
  to: string;
  text: string;
}

/**
 * Port d'envoi de SMS. Implémentation : Brevo, ou un transport mémoire en test.
 */
export interface SmsSender {
  envoyer(message: SmsMessage): Promise<void>;
}
