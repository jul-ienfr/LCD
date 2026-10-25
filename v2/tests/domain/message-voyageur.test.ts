import { describe, expect, it } from "vitest";
import {
  contientCodeSensible,
  envoyerMessage,
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

  it("n’envoie qu’un brouillon", () => {
    expect(envoyerMessage("brouillon").statut).toBe("envoye");
    expect(envoyerMessage("brouillon").envoyeAt).toBeInstanceOf(Date);
    expect(() => envoyerMessage("envoye")).toThrow(ErreurMetier);
  });
});
