import type {
  EmailMessage,
  EmailSender,
} from "@/application/ports/email";

export class EmailSenderMemoire implements EmailSender {
  readonly messages: EmailMessage[] = [];

  async envoyer(message: EmailMessage): Promise<void> {
    this.messages.push(message);
  }
}
