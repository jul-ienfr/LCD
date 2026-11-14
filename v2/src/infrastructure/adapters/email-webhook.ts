import { createHmac, timingSafeEqual } from "node:crypto";
import {
  normaliserEmailEntrant,
  type EmailEntrant,
  type EmailEntrantBrut,
} from "@/domain/email-entrant";

/**
 * T307 — adaptateur générique de webhook e-mail (Postmark, Mailgun, Brevo…).
 *
 * Le fournisseur doit signer le corps brut avec HMAC-SHA256. Le HTML n'est
 * jamais lu ; les pièces jointes sont attendues en base64 et filtrées par le
 * domaine (8 Mo, 8 pièces, types autorisés côté stockage).
 */
export function signatureEmailValide(
  corps: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || secret.length < 32) return false;
  const recue = signature.replace(/^sha256=/iu, "").trim();
  if (!/^[a-f0-9]{64}$/iu.test(recue)) return false;
  const attendue = createHmac("sha256", secret).update(corps).digest("hex");
  return timingSafeEqual(
    Buffer.from(recue.toLowerCase(), "hex"),
    Buffer.from(attendue, "hex"),
  );
}

function texte(objet: Record<string, unknown>, ...cles: string[]): unknown {
  for (const cle of cles) {
    if (objet[cle] !== undefined && objet[cle] !== null) return objet[cle];
  }
  return undefined;
}

function piecesJointes(
  valeur: unknown,
): Array<{ nomFichier: string; typeMime: string; octets: Uint8Array }> {
  if (!Array.isArray(valeur)) return [];
  const resultat: Array<{
    nomFichier: string;
    typeMime: string;
    octets: Uint8Array;
  }> = [];
  for (const entree of valeur) {
    if (!entree || typeof entree !== "object") continue;
    const objet = entree as Record<string, unknown>;
    const nomFichier = texte(objet, "nomFichier", "filename", "name");
    const typeMime = texte(objet, "typeMime", "contentType", "content_type");
    const base64 = texte(
      objet,
      "contenuBase64",
      "contentBase64",
      "content_base64",
      "base64",
    );
    if (
      typeof nomFichier !== "string" ||
      typeof typeMime !== "string" ||
      typeof base64 !== "string"
    ) {
      continue;
    }
    try {
      const octets = Uint8Array.from(Buffer.from(base64, "base64"));
      if (octets.byteLength > 0) {
        resultat.push({ nomFichier, typeMime, octets });
      }
    } catch {
      // Une pièce jointe illisible est ignorée ; le message reste reçu.
    }
  }
  return resultat;
}

export function lireEmailWebhook(corps: string): EmailEntrant | null {
  let brut: Record<string, unknown>;
  try {
    const valeur: unknown = JSON.parse(corps);
    if (!valeur || typeof valeur !== "object" || Array.isArray(valeur)) {
      return null;
    }
    brut = valeur as Record<string, unknown>;
  } catch {
    return null;
  }

  const donnees: EmailEntrantBrut = {
    messageId: texte(brut, "messageId", "message_id", "MessageID"),
    inReplyTo: texte(brut, "inReplyTo", "in_reply_to", "InReplyTo"),
    de: texte(brut, "de", "from", "expediteur"),
    vers: texte(brut, "vers", "to", "destinataire"),
    sujet: texte(brut, "sujet", "subject"),
    texte: texte(brut, "texte", "text", "body"),
    date: texte(brut, "date", "Date", "receivedAt"),
    piecesJointes: piecesJointes(
      texte(brut, "piecesJointes", "attachments", "Attachments"),
    ),
  };
  return normaliserEmailEntrant(donnees);
}
