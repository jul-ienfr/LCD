import type { EmailSender } from "@/application/ports/email";

/** Adapter Brevo/SMTP : le fournisseur reste confiné ici. */
export function creerEmailBrevo(): EmailSender {
  return {
    async envoyer(): Promise<void> {
      throw new Error(
        "Email non configuré : implémenter l'appel Brevo ou SMTP dans cet adapter.",
      );
    },
  };
}
