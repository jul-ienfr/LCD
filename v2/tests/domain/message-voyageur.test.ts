import { describe, expect, it } from "vitest";
import {
  contientCodeSensible,
  emailValide,
  envoyerMessage,
  normaliserDestinataire,
  sujetMessage,
  telephoneValide,
  validerMessage,
} from "@/domain/message-voyageur";
import { ErreurMetier } from "@/domain/erreurs";

describe("domaine messages voyageurs", () => {
  it("détecte un code d’accès sans bloquer dates ni montants", () => {
    expect(contientCodeSensible("Votre code d’accès est 4821.")).toBe(true);
    expect(contientCodeSensible("Code boîte : 8473")).toBe(true);
    expect(contientCodeSensible("PIN 5678 pour l’entrée")).toBe(true);
    expect(contientCodeSensible("La clé est le 1234.")).toBe(true);
    expect(contientCodeSensible("Séjour du 12/10/2026, 350 €")).toBe(false);
    expect(contientCodeSensible("Enregistrement 06088202600012")).toBe(false);
    expect(contientCodeSensible("Arrivée à 15 h, code de la rue non requis")).toBe(
      false,
    );
  });

  it("valide le canal, le type et le contenu", () => {
    expect(
      validerMessage({
        canal: "sms",
        type: "j1",
        contenu: "  Votre séjour approche, à demain !  ",
      }),
    ).toEqual({
      canal: "sms",
      type: "j1",
      contenu: "Votre séjour approche, à demain !",
      destinataire: null,
    });
    expect(() =>
      validerMessage({
        canal: "fax",
        type: "j1",
        contenu: "Votre séjour approche, à demain !",
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerMessage({
        canal: "email",
        type: "inconnu",
        contenu: "Votre séjour approche, à demain !",
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerMessage({ canal: "email", type: "j1", contenu: "court" }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerMessage({
        canal: "sms",
        type: "arrivee",
        contenu: "Votre code d’accès est 4821, bonne arrivée.",
      }),
    ).toThrow(/PIN/);
  });

  it("valide l’adresse e-mail du voyageur", () => {
    expect(emailValide("camille@example.com")).toBe(true);
    expect(emailValide("camille+sejour@example.co")).toBe(true);
    expect(emailValide("camille.example.com")).toBe(false);
    expect(emailValide("camille@example")).toBe(false);
    expect(emailValide("camille @example.com")).toBe(false);

    expect(
      validerMessage({
        canal: "email",
        type: "arrivee",
        contenu: "Votre séjour approche, à demain !",
        destinataire: "  camille@example.com ",
      }).destinataire,
    ).toBe("camille@example.com");
    expect(() =>
      validerMessage({
        canal: "email",
        type: "arrivee",
        contenu: "Votre séjour approche, à demain !",
        destinataire: "pas-un-email",
      }),
    ).toThrow(/e-mail/);
    expect(sujetMessage("depart")).toBe("Votre séjour — Départ");
  });

  it("valide et normalise un numéro pour le canal SMS", () => {
    expect(telephoneValide("06 12 34 56 78")).toBe(true);
    expect(telephoneValide("+33 6 12 34 56 78")).toBe(true);
    expect(telephoneValide("+33612345678")).toBe(true);
    expect(telephoneValide("123")).toBe(false);
    expect(telephoneValide("06 12 34 56 78 90 12 34")).toBe(false);
    expect(normaliserDestinataire("sms", "06 12 34 56 78")).toBe(
      "0612345678",
    );
    expect(normaliserDestinataire("email", " camille@example.com ")).toBe(
      "camille@example.com",
    );
    expect(
      validerMessage({
        canal: "sms",
        type: "j1",
        contenu: "Votre séjour approche, à demain !",
        destinataire: "06.12.34.56.78",
      }).destinataire,
    ).toBe("0612345678");
    expect(() =>
      normaliserDestinataire("sms", "pas-un-numero"),
    ).toThrow(/téléphone/);
    expect(() =>
      normaliserDestinataire("email", "06 12 34 56 78"),
    ).toThrow(/e-mail/);
  });

  it("n’envoie qu’un brouillon", () => {
    expect(envoyerMessage("brouillon").statut).toBe("envoye");
    expect(envoyerMessage("brouillon").envoyeAt).toBeInstanceOf(Date);
    expect(() => envoyerMessage("envoye")).toThrow(ErreurMetier);
  });
});
