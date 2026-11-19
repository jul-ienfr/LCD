import nodemailer from "nodemailer";
import type { EmailSender } from "@/application/ports/email";
import { habillerEmail, paletteEmail, themeResolu } from "@/lib/apparence";
import { env } from "@/lib/env";
import { lireApparencePubliee } from "@/lib/server/apparence";
import { avecReessais } from "./http-retry";

/** Codes réseau de nodemailer pour lesquels aucune donnée n'a pu partir. */
const CODES_RESEAU_SANS_ENVOI = new Set([
  "ECONNECTION",
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ESOCKET",
  "EDNS",
  "ENOTFOUND",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "EAI_AGAIN",
]);

/** Commandes SMTP pendant lesquelles un échec n'implique aucun envoi. */
const COMMANDES_SANS_ENVOI = new Set([
  "CONN",
  "EHLO",
  "STARTTLS",
  "AUTH",
  "MAIL",
  "RCPT",
]);

/**
 * Une erreur SMTP est transitoire si le serveur l'a explicitement refusée
 * comme temporaire (4xx : greylisting, boîte pleine…) ou si la connexion
 * n'a jamais abouti (rien n'a pu partir). Un 5xx ou un échec pendant DATA
 * est définitif : rejouer risquerait un doublon visible du destinataire.
 */
export function erreurSmtpTransitoire(erreur: unknown): boolean {
  if (!(erreur instanceof Error)) return false;
  const detail = erreur as Error & {
    code?: string;
    command?: string;
    responseCode?: number;
  };
  if (typeof detail.responseCode === "number") {
    return detail.responseCode >= 400 && detail.responseCode < 500;
  }
  if (!detail.code || !CODES_RESEAU_SANS_ENVOI.has(detail.code)) return false;
  return !detail.command || COMMANDES_SANS_ENVOI.has(detail.command);
}

/**
 * Adapter SMTP : Mailpit en dev, Brevo/OVH/Scaleway en production.
 * Le fournisseur reste confiné ici ; le reste de l'app ne connaît que le port.
 */
export function creerEmailSmtp(): EmailSender {
  if (!env.EMAIL_ENABLED) {
    throw new Error(
      "Email désactivé : configurez SMTP_URL et EMAIL_ENABLED=true.",
    );
  }

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
    pool: true,
    maxConnections: 2,
    maxMessages: 100,
  });

  return {
    async envoyer(message): Promise<void> {
      const apparence = await lireApparencePubliee();
      const palette = paletteEmail(
        themeResolu(apparence),
        apparence.identite.nom,
      );
      // Politique de retry (FR-022) : seules les erreurs transitoires sont
      // rejouées (voir erreurSmtpTransitoire) ; la composition du message est
      // refaite à l'identique, donc un rejeu ne duplique pas l'envoi côté
      // serveur SMTP.
      await avecReessais(
        () =>
          transport.sendMail({
            from: env.EMAIL_FROM,
            to: message.to,
            subject: message.subject,
            text: message.text,
            html: message.html ?? habillerEmail(message.text, palette),
            replyTo: message.replyTo,
            attachments: message.attachments?.map((piece) => ({
              filename: piece.filename,
              content: Buffer.from(piece.content),
              contentType: piece.contentType,
            })),
          }),
        { estTransitoire: erreurSmtpTransitoire },
      );
    },
  };
}
