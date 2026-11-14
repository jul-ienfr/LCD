import { describe, expect, it } from "vitest";
import {
  normaliserEmailEntrant,
  slugTenantDepuisDestinataire,
  TAILLE_PIECE_EMAIL_MAX,
} from "@/domain/email-entrant";

const base = {
  messageId: "<abc@mail.example.fr>",
  de: "Camille <camille@example.fr>",
  vers: "reponses+demo@inbox.example.fr",
  sujet: "Question arrivée",
  texte: "Bonjour, à quelle heure pouvons-nous arriver ?",
  date: "2026-11-10T08:00:00.000Z",
};

describe("e-mail entrant", () => {
  it("extrait le slug du destinataire plus-adressé", () => {
    expect(
      slugTenantDepuisDestinataire(
        "LCD <reponses+demo@inbox.example.fr>",
        "inbox.example.fr",
      ),
    ).toBe("demo");
    expect(
      slugTenantDepuisDestinataire("demo@inbox.example.fr", "inbox.example.fr"),
    ).toBe("demo");
    expect(
      slugTenantDepuisDestinataire("demo@autre.fr", "inbox.example.fr"),
    ).toBeNull();
    expect(
      slugTenantDepuisDestinataire("reponses+Demo@inbox.example.fr", "inbox.example.fr"),
    ).toBe("demo");
  });

  it("normalise un message valide et ignore le HTML", () => {
    const email = normaliserEmailEntrant({
      ...base,
      html: "<img src=x onerror=alert(1)>",
    });
    expect(email).toMatchObject({
      de: "camille@example.fr",
      vers: "reponses+demo@inbox.example.fr",
      sujet: "Question arrivée",
    });
    expect(email?.date.toISOString()).toBe("2026-11-10T08:00:00.000Z");
    expect(JSON.stringify(email)).not.toContain("onerror");
  });

  it("refuse un message sans identifiant ou avec un expéditeur invalide", () => {
    expect(normaliserEmailEntrant({ ...base, messageId: "" })).toBeNull();
    expect(normaliserEmailEntrant({ ...base, de: "pas-un-email" })).toBeNull();
    expect(normaliserEmailEntrant({ ...base, texte: "   ", sujet: "" })).toBeNull();
  });

  it("conserve les pièces jointes sous la limite et écarte les autres", () => {
    const email = normaliserEmailEntrant({
      ...base,
      piecesJointes: [
        {
          nomFichier: "arrivee.pdf",
          typeMime: "application/pdf",
          octets: new Uint8Array([1, 2, 3]),
        },
        {
          nomFichier: "trop-gros.pdf",
          typeMime: "application/pdf",
          octets: new Uint8Array(TAILLE_PIECE_EMAIL_MAX + 1),
        },
        { nomFichier: "vide.txt", typeMime: "text/plain", octets: new Uint8Array() },
      ],
    });
    expect(email?.piecesJointes).toHaveLength(1);
    expect(email?.piecesJointes[0]?.nomFichier).toBe("arrivee.pdf");
  });
});
