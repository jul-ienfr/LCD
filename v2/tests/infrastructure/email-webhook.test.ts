import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  lireEmailWebhook,
  signatureEmailValide,
} from "@/infrastructure/adapters/email-webhook";

const SECRET = "secret-de-test-suffisamment-long-32";

function signer(corps: string): string {
  return `sha256=${createHmac("sha256", SECRET).update(corps).digest("hex")}`;
}

const corps = JSON.stringify({
  message_id: "<msg-1@mail.example.fr>",
  from: "Camille <camille@example.fr>",
  to: "reponses+demo@inbox.example.fr",
  subject: "Re: arrivée",
  text: "Bonjour, arrivée vers 18 h.",
  date: "2026-11-10T08:00:00.000Z",
  attachments: [
    {
      filename: "arrivee.pdf",
      content_type: "application/pdf",
      content_base64: Buffer.from([1, 2, 3]).toString("base64"),
    },
  ],
});

describe("webhook e-mail", () => {
  it("accepte une signature HMAC valide", () => {
    expect(signatureEmailValide(corps, signer(corps), SECRET)).toBe(true);
  });

  it("refuse une signature absente, courte ou altérée", () => {
    expect(signatureEmailValide(corps, null, SECRET)).toBe(false);
    expect(signatureEmailValide(corps, signer(corps), "court")).toBe(false);
    expect(
      signatureEmailValide(`${corps} `, signer(corps), SECRET),
    ).toBe(false);
  });

  it("lit les alias de champs et décode les pièces jointes", () => {
    const email = lireEmailWebhook(corps);
    expect(email).toMatchObject({
      messageId: "<msg-1@mail.example.fr>",
      de: "camille@example.fr",
      vers: "reponses+demo@inbox.example.fr",
      sujet: "Re: arrivée",
    });
    expect(email?.piecesJointes[0]?.nomFichier).toBe("arrivee.pdf");
    expect(Array.from(email?.piecesJointes[0]?.octets ?? [])).toEqual([1, 2, 3]);
  });

  it("retourne null sur un JSON invalide", () => {
    expect(lireEmailWebhook("{pas du json")).toBeNull();
    expect(lireEmailWebhook("[]")).toBeNull();
  });
});
