import { describe, expect, it } from "vitest";
import { ErreurMetier } from "@/domain/erreurs";
import {
  apercu,
  appliquerOptout,
  cleRegroupement,
  consentementAutorise,
  CONSENTEMENTS_DEFAUT,
  memeContact,
  messageEstOptout,
  resumerMessagesParFils,
  validerFilVoyageur,
  type ConsentementsFil,
  type FilVoyageur,
} from "@/domain/fil-voyageur";

function fil(partiel: Partial<FilVoyageur>): FilVoyageur {
  return {
    id: "fil-1",
    tenantId: "tenant-1",
    logementId: "logement-1",
    reservationId: null,
    voyageurNom: "Camille Test",
    voyageurEmail: "camille@example.fr",
    voyageurTelephone: "+33612345678",
    langue: "fr",
    cleRegroupement: "email:camille@example.fr",
    consentements: CONSENTEMENTS_DEFAUT,
    statut: "ouvert",
    assigneA: null,
    dernierMessageAt: null,
    createdAt: new Date("2026-11-01T10:00:00Z"),
    updatedAt: new Date("2026-11-01T10:00:00Z"),
    ...partiel,
  };
}

describe("domaine des fils voyageur", () => {
  it("calcule une clé de regroupement stable", () => {
    expect(cleRegroupement({ email: " Camille@Example.FR " })).toBe(
      "email:camille@example.fr",
    );
    expect(cleRegroupement({ telephone: "+33 6 12 34 56 78" })).toBe(
      "tel:+33612345678",
    );
    expect(cleRegroupement({ externalId: "OTA-42" })).toBe("ext:ota-42");
    expect(cleRegroupement({})).toBe("");
  });

  it("regroupe un message dans le fil du même contact", () => {
    const existant = fil({});
    expect(memeContact(existant, { email: "CAMILLE@example.fr" })).toBe(true);
    expect(memeContact(existant, { telephone: "06.12.34.56.78" })).toBe(false);
    expect(
      memeContact(fil({ cleRegroupement: "tel:+33612345678" }), {
        telephone: "+33 6 12 34 56 78",
      }),
    ).toBe(true);
    expect(memeContact(existant, { externalId: "autre" })).toBe(false);
    expect(memeContact(existant, {})).toBe(false);
  });

  it("tronque l'aperçu sans casser les mots", () => {
    expect(apercu("  Bonjour   à tous  ")).toBe("Bonjour à tous");
    const long = apercu("x".repeat(400));
    expect(long.length).toBe(140);
    expect(long.endsWith("…")).toBe(true);
  });

  it("n'exige un consentement que pour les canaux poussés", () => {
    const consentements: ConsentementsFil = {
      email: true,
      sms: false,
      whatsapp: false,
    };
    expect(consentementAutorise(consentements, "email")).toBe(true);
    expect(consentementAutorise(consentements, "ota")).toBe(true);
    expect(consentementAutorise(consentements, "sms")).toBe(false);
    expect(consentementAutorise(consentements, "whatsapp")).toBe(false);
    expect(consentementAutorise({ ...consentements, sms: true }, "sms")).toBe(true);
  });

  it("reconnaît un refus et le mémorise par canal", () => {
    for (const texte of ["STOP", "Arrêtez", "merci de me désabonner", "unsubscribe"]) {
      expect(messageEstOptout(texte)).toBe(true);
    }
    expect(messageEstOptout("Bonjour, tout va bien")).toBe(false);

    const apres = appliquerOptout({ email: true, sms: true, whatsapp: true }, "sms");
    expect(apres.sms).toBe(false);
    expect(apres.whatsapp).toBe(true);
    expect(apres.email).toBe(true);
  });

  it("refuse un fil sans moyen de contact", () => {
    expect(() =>
      validerFilVoyageur({ voyageurNom: "Camille Test" }),
    ).toThrowError(ErreurMetier);
    expect(() =>
      validerFilVoyageur({ voyageurNom: "C", voyageurEmail: "a@b.fr" }),
    ).toThrowError(/2 à 120/);
    expect(() =>
      validerFilVoyageur({ voyageurNom: "Camille", voyageurEmail: "pas-un-email" }),
    ).toThrowError(/email/i);
    expect(() =>
      validerFilVoyageur({ voyageurNom: "Camille", voyageurTelephone: "12" }),
    ).toThrowError(/téléphone/i);
    expect(() =>
      validerFilVoyageur({
        voyageurNom: "Camille",
        voyageurEmail: "a@b.fr",
        langue: "français",
      }),
    ).toThrowError(/langue/i);
    expect(() =>
      validerFilVoyageur({ voyageurNom: "Camille Test", voyageurEmail: "a@b.fr" }),
    ).not.toThrow();
  });
});

describe("résumé des messages par fil (FR-027)", () => {
  function message(
    filId: string,
    partiel: Partial<{
      sens: "entrant" | "sortant";
      statut: string;
      luAt: Date | null;
      createdAt: Date;
      contenu: string;
    }> = {},
  ) {
    return {
      filId,
      sens: partiel.sens ?? "sortant",
      statut: partiel.statut ?? "envoye",
      luAt: partiel.luAt ?? null,
      createdAt: partiel.createdAt ?? new Date("2026-11-01T10:00:00Z"),
      contenu: partiel.contenu ?? "Bonjour",
    };
  }

  it("compte les non-lus entrants, les brouillons et le dernier message", () => {
    const t0 = new Date("2026-11-01T10:00:00Z");
    const t1 = new Date("2026-11-01T11:00:00Z");
    const t2 = new Date("2026-11-01T12:00:00Z");
    const resume = resumerMessagesParFils(["fil-1"], [
      message("fil-1", { createdAt: t1, contenu: "deuxième" }),
      message("fil-1", { sens: "entrant", statut: "recu", createdAt: t0 }),
      message("fil-1", { sens: "entrant", statut: "recu", luAt: t1, createdAt: t0 }),
      message("fil-1", { statut: "brouillon", createdAt: t2, contenu: "dernier" }),
    ]);

    const entree = resume.get("fil-1");
    expect(entree?.total).toBe(4);
    expect(entree?.nonLus).toBe(1);
    expect(entree?.brouillons).toBe(1);
    // Le dernier suit `createdAt`, même si le tableau arrive dans le désordre.
    expect(entree?.dernier?.contenu).toBe("dernier");
  });

  it("renvoie une entrée vide pour un fil sans message, ignore les fils inconnus", () => {
    const resume = resumerMessagesParFils(
      ["fil-1", "fil-2"],
      [message("fil-3")],
    );
    expect(resume.get("fil-1")).toEqual({
      total: 0,
      nonLus: 0,
      brouillons: 0,
      dernier: null,
    });
    expect(resume.get("fil-2")?.total).toBe(0);
    expect(resume.size).toBe(2);
  });

  it("ignore un message sans fil", () => {
    const resume = resumerMessagesParFils(
      ["fil-1"],
      [message("fil-1"), { ...message("fil-1"), filId: null }],
    );
    expect(resume.get("fil-1")?.total).toBe(1);
  });
});
