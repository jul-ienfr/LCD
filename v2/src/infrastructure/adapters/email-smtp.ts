import nodemailer from "nodemailer";
import type { EmailSender } from "@/application/ports/email";
import { env } from "@/lib/env";

/**
 * Adapter SMTP : Mailpit en dev, Brevo/OVH/Scaleway en production.
 * Le fournisseur reste confiné ici ; le reste de l'app ne connaît que le port.
 */
export function creerEmailSmtp(): EmailSender {
  const url = new URL(env.SMTP_URL);
  const transport = nodemailer.createTransport({
    host: url.hostname,
    port: Number(url.port || (url.protocol === "smtps:" ? 465 : 587)),
    secure: url.protocol === "smtps:",
    auth: url.username
      ? {
          user: decodeURIComponent(url.username),
          pass: decodeURIComponent(url.password),
        }
      : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 20_000,
    socketTimeout: 30_000,
  });

  return {
    async envoyer(message): Promise<void> {
      await transport.sendMail({
        from: env.EMAIL_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        replyTo: message.replyTo,
      });
    },
  };
}
