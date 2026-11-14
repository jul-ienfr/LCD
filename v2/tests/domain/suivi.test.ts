import { describe, expect, it } from "vitest";
import {
  campagneDepuisParametres,
  configurationSuiviActive,
  configurationSuiviVide,
  consentementAvec,
  consentementRefuse,
  consentementTout,
  lireConsentement,
  normaliserEvenementSuivi,
  serialiserConsentement,
  validerConfigurationSuivi,
} from "@/domain/suivi";

describe("consentement de suivi", () => {
  it("sérialise et relit les deux catégories", () => {
    const tout = consentementTout();
    expect(serialiserConsentement(tout)).toBe("v1.m1.p1");
    expect(lireConsentement("v1.m1.p1")).toEqual(tout);
    expect(lireConsentement("v1.m0.p0")).toEqual(consentementRefuse());
    expect(lireConsentement("v1.m1.p0")).toEqual(
      consentementAvec(true, false),
    );
  });

  it("refuse un cookie absent ou forgé", () => {
    expect(lireConsentement(undefined)).toBeNull();
    expect(lireConsentement("")).toBeNull();
    expect(lireConsentement("v1.m2.p1")).toBeNull();
    expect(lireConsentement("m1p1")).toBeNull();
  });
});

describe("configuration de suivi", () => {
  it("accepte une configuration vide et la considère inactive", () => {
    const vide = configurationSuiviVide();
    expect(configurationSuiviActive(vide)).toBe(false);
    expect(configurationSuiviActive({ ...vide, actif: true })).toBe(false);
  });

  it("valide les identifiants et active le suivi", () => {
    const configuration = validerConfigurationSuivi({
      actif: true,
      mesure: {
        ga4Id: "G-ABC1234567",
        matomoUrl: "https://matomo.example.fr/",
        matomoSiteId: "12",
        plausibleDomain: "sejour.example.fr",
      },
      publicite: {
        metaPixelId: "123456789012345",
        googleAdsId: "AW-123456789",
        tiktokPixelId: "ABCDEF123456",
      },
    });
    expect(configuration.mesure.matomoUrl).toBe("https://matomo.example.fr");
    expect(configurationSuiviActive(configuration)).toBe(true);
  });

  it("refuse les identifiants manifestement invalides", () => {
    expect(() =>
      validerConfigurationSuivi({ mesure: { ga4Id: "UA-123" } }),
    ).toThrow(/GA4/);
    expect(() =>
      validerConfigurationSuivi({
        mesure: { matomoUrl: "http://matomo.example.fr" },
      }),
    ).toThrow(/HTTPS/);
    expect(() =>
      validerConfigurationSuivi({
        publicite: { metaPixelId: "abc" },
      }),
    ).toThrow(/Meta/);
  });
});

describe("événements de suivi", () => {
  it("normalise une page vue et filtre les campagnes inconnues", () => {
    const evenement = normaliserEvenementSuivi({
      type: "page_vue",
      page: "/site/le-port",
      nom: "Accueil",
      campagne: { utm_source: "google", utm_campaign: "automne", pirate: "x" },
      metadata: { appareil: "mobile", profondeur: 2 },
    });
    expect(evenement).toMatchObject({
      type: "page_vue",
      page: "/site/le-port",
      nom: "Accueil",
      campagne: { source: "google", campagne: "automne" },
      metadata: { appareil: "mobile", profondeur: 2 },
    });
  });

  it("refuse un type ou une page invalide", () => {
    expect(() =>
      normaliserEvenementSuivi({ type: "mousemove", page: "/" }),
    ).toThrow(/Type/);
    expect(() =>
      normaliserEvenementSuivi({ type: "clic", page: "https://ailleurs.fr" }),
    ).toThrow(/Page/);
    expect(() =>
      normaliserEvenementSuivi({ type: "clic", page: "//evil.fr" }),
    ).toThrow(/Page/);
  });

  it("borne les métadonnées et la valeur", () => {
    const evenement = normaliserEvenementSuivi({
      type: "conversion",
      page: "/reserver",
      valeurCentimes: 42_000,
      metadata: Object.fromEntries(
        Array.from({ length: 30 }, (_, index) => [`cle${index}`, "x"]),
      ),
    });
    expect(Object.keys(evenement.metadata)).toHaveLength(20);
    expect(evenement.valeurCentimes).toBe(42_000);
  });

  it("masque les e-mails et numéros dans les métadonnées", () => {
    const evenement = normaliserEvenementSuivi({
      type: "clic",
      page: "/contact",
      metadata: {
        email: "camille@example.fr",
        telephone: "+33 6 12 34 56 78",
      },
    });
    expect(evenement.metadata.email).toBe("[e-mail masqué]");
    expect(evenement.metadata.telephone).toBe("[numéro masqué]");
  });

  it("extrait les paramètres de campagne", () => {
    const campagne = campagneDepuisParametres(
      new URLSearchParams(
        "utm_source=meta&utm_medium=cpc&utm_campaign=ete&gclid=abc",
      ),
    );
    expect(campagne).toEqual({
      source: "meta",
      medium: "cpc",
      campagne: "ete",
      gclid: "abc",
    });
  });
});
