import { describe, expect, it } from "vitest";
import {
  DUREE_LIEN_GUIDE_JOURS,
  ORDRE_SECTIONS_GUIDE,
  creerLienGuide,
  expirationLienGuide,
  langueGuideValide,
  resoudreContenuSection,
  sectionGuideValide,
  validerContenuSection,
  verifierLienGuide,
  type GuideVoyageur,
} from "@/domain/guide-voyageur";

const SECRET = "secret-guide-voyageur-tres-long-pour-test";
const base = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  logementId: "22222222-2222-4222-8222-222222222222",
  reservationId: "33333333-3333-4333-8333-333333333333",
};

describe("guide-voyageur : langues et sections", () => {
  it("accepte les langues du guide et refuse les autres", () => {
    expect(langueGuideValide("fr")).toBe(true);
    expect(langueGuideValide("nl")).toBe(true);
    expect(langueGuideValide("pt")).toBe(false);
    expect(langueGuideValide("")).toBe(false);
  });

  it("accepte les sections du guide et refuse les autres", () => {
    expect(sectionGuideValide("arrivee")).toBe(true);
    expect(sectionGuideValide("urgence")).toBe(true);
    expect(sectionGuideValide("autre")).toBe(false);
  });

  it("ordonne les sections de l'arrivée à l'urgence", () => {
    expect(ORDRE_SECTIONS_GUIDE[0]).toBe("arrivee");
    expect(ORDRE_SECTIONS_GUIDE[ORDRE_SECTIONS_GUIDE.length - 1]).toBe(
      "urgence",
    );
  });
});

describe("guide-voyageur : validation de contenu", () => {
  it("valide un contenu correct", () => {
    const erreurs = validerContenuSection({
      langue: "fr",
      titre: "Arrivée",
      corps: "Adresse et code d'accès.",
    });
    expect(erreurs).toEqual([]);
  });

  it("refuse un titre vide ou trop long", () => {
    expect(
      validerContenuSection({ langue: "fr", titre: "  ", corps: "x" }),
    ).toContain("Le titre de la section est requis.");
    expect(
      validerContenuSection({ langue: "fr", titre: "a".repeat(121), corps: "x" }),
    ).toContain("Le titre est limité à 120 caractères.");
  });

  it("refuse un corps vide ou trop long", () => {
    expect(
      validerContenuSection({ langue: "fr", titre: "t", corps: "" }),
    ).toContain("Le corps de la section est requis.");
    expect(
      validerContenuSection({ langue: "fr", titre: "t", corps: "a".repeat(5001) }),
    ).toContain("Le corps est limité à 5000 caractères.");
  });

  it("refuse une langue inconnue", () => {
    const erreurs = validerContenuSection({
      langue: "pt" as never,
      titre: "t",
      corps: "c",
    });
    expect(erreurs).toContain("Langue inconnue : pt.");
  });
});

describe("guide-voyageur : résolution de contenu", () => {
  const guide: GuideVoyageur = {
    logementId: base.logementId,
    langueParDefaut: "fr",
    telUrgence: "+33 6 00 00 00 00",
    sections: {
      arrivee: {
        fr: { langue: "fr", titre: "Arrivée", corps: "Version française." },
        en: { langue: "en", titre: "Check-in", corps: "English version." },
      },
      depart: {
        fr: { langue: "fr", titre: "Départ", corps: "Checklist départ." },
      },
    },
  };

  it("retourne le contenu dans la langue demandée", () => {
    const contenu = resoudreContenuSection(guide, "arrivee", "en");
    expect(contenu?.titre).toBe("Check-in");
  });

  it("revient à la langue par défaut puis au français", () => {
    const contenu = resoudreContenuSection(guide, "depart", "de");
    expect(contenu?.titre).toBe("Départ");
  });

  it("retourne null pour une section sans contenu", () => {
    expect(resoudreContenuSection(guide, "wifi", "fr")).toBeNull();
  });
});

describe("guide-voyageur : lien signé", () => {
  it("crée puis vérifie un lien", () => {
    const token = creerLienGuide(SECRET, base);
    const payload = verifierLienGuide(SECRET, token);
    expect(payload?.tenantId).toBe(base.tenantId);
    expect(payload?.logementId).toBe(base.logementId);
    expect(payload?.reservationId).toBe(base.reservationId);
  });

  it("refuse un lien altéré", () => {
    const token = creerLienGuide(SECRET, base);
    const altere = `${token.slice(0, -2)}xx`;
    expect(verifierLienGuide(SECRET, altere)).toBeNull();
  });

  it("refuse un lien signé avec un autre secret", () => {
    const token = creerLienGuide(SECRET, base);
    expect(verifierLienGuide("autre-secret-tres-long-pour-test", token)).toBeNull();
  });

  it("refuse un lien expiré", () => {
    const token = creerLienGuide(SECRET, { ...base, exp: 1 });
    expect(verifierLienGuide(SECRET, token)).toBeNull();
  });

  it("refuse un lien malformé", () => {
    expect(verifierLienGuide(SECRET, "")).toBeNull();
    expect(verifierLienGuide(SECRET, "pasunpoint")).toBeNull();
    expect(verifierLienGuide(SECRET, "a.b.c")).toBeNull();
    expect(verifierLienGuide("", base64urlValide())).toBeNull();
  });

  it("refuse un payload corrompu mais bien signé", () => {
    const charge = Buffer.from("{\"v\":2}", "utf8").toString("base64url");
    const { createHmac } = require("node:crypto");
    const sig = createHmac("sha256", SECRET).update(charge).digest("base64url");
    expect(verifierLienGuide(SECRET, `${charge}.${sig}`)).toBeNull();
  });

  it("lève si le secret est vide", () => {
    expect(() => creerLienGuide("", base)).toThrow();
  });

  it("lève si un identifiant manque", () => {
    expect(() => creerLienGuide(SECRET, { ...base, logementId: "" })).toThrow();
  });
});

describe("guide-voyageur : expiration", () => {
  it("calcule une expiration au-delà de la durée minimale", () => {
    const exp = expirationLienGuide("2026-12-05");
    const minimum =
      Math.floor(Date.now() / 1000) + DUREE_LIEN_GUIDE_JOURS * 24 * 60 * 60;
    expect(exp).toBeGreaterThanOrEqual(minimum - 1);
  });

  it("prolonge l'expiration après un séjour lointain", () => {
    const court = expirationLienGuide("2026-11-10");
    const loin = expirationLienGuide("2027-06-01");
    expect(loiN(court, loin)).toBe(true);
  });
});

function base64urlValide(): string {
  const charge = Buffer.from(JSON.stringify({ v: 1 }), "utf8").toString(
    "base64url",
  );
  return `${charge}.x`;
}

function loiN(a: number, b: number): boolean {
  return b > a;
}
