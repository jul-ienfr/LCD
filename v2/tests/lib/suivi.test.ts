import { describe, expect, it } from "vitest";
import {
  configurationSuiviVide,
  consentementRefuse,
  consentementTout,
  type ConfigurationSuivi,
} from "@/domain/suivi";
import {
  scriptsClientSuivi,
  scriptsMesure,
  scriptsPublicite,
} from "@/lib/server/suivi";

function configuration(): ConfigurationSuivi {
  return {
    ...configurationSuiviVide(),
    actif: true,
    mesure: {
      ga4Id: "G-ABC1234567",
      matomoUrl: "https://matomo.example.fr",
      matomoSiteId: "12",
      plausibleDomain: "sejour.example.fr",
    },
    publicite: {
      metaPixelId: "123456789012345",
      googleAdsId: "AW-123456789",
      tiktokPixelId: "ABCDEF123456",
    },
  };
}

describe("scripts de suivi public", () => {
  it("ne charge rien sans consentement", () => {
    expect(scriptsMesure(configuration(), consentementRefuse())).toEqual([]);
    expect(scriptsPublicite(configuration(), consentementRefuse())).toEqual([]);
    expect(scriptsClientSuivi("le-port", consentementRefuse())).toEqual([]);
  });

  it("charge GA4, Matomo et Plausible avec la mesure seule", () => {
    const scripts = scriptsMesure(configuration(), consentementTout());
    expect(scripts).toHaveLength(3);
    expect(scripts.join("")).toContain("G-ABC1234567");
    expect(scripts.join("")).toContain("matomo.example.fr");
    expect(scripts.join("")).toContain("plausible.io");
  });

  it("exige mesure + publicité pour les pixels", () => {
    expect(
      scriptsPublicite(
        configuration(),
        { version: "2026-11", mesure: true, publicite: false },
      ),
    ).toEqual([]);
    const scripts = scriptsPublicite(configuration(), consentementTout());
    expect(scripts.join("")).toContain("connect.facebook.net");
    expect(scripts.join("")).toContain("AW-123456789");
    expect(scripts.join("")).toContain("analytics.tiktok.com");
  });

  it("ne charge aucun script tiers bloquant", () => {
    // Aucune ressource tierce ne doit figurer dans le HTML initial : une balise
    // `<script async src=…>` ne bloque pas `DOMContentLoaded` mais retarde bien
    // `load`, et un vendeur injoignable (plausible.io le 2026-11-13) faisait
    // expirer `page.goto(…, { waitUntil: "load" })` au bout de 30 s. Les tiers
    // sont donc injectés après `load` par un script inline.
    const scripts = [
      ...scriptsMesure(configuration(), consentementTout()),
      ...scriptsPublicite(configuration(), consentementTout()),
    ].join("");
    expect(scripts).not.toMatch(/<script[^>]*\ssrc=/);
    expect(scripts).not.toContain("defer");
    expect(scripts).toContain("addEventListener('load'");
    // Les configurations restent dans le HTML (rien n'est perdu) …
    expect(scripts).toContain("plausible.io/js/script.js");
    expect(scripts).toContain("data-domain");
    expect(scripts).toContain("googletagmanager.com/gtag/js");
    expect(scripts).toContain("connect.facebook.net/en_US/fbevents.js");
    expect(scripts).toContain("analytics.tiktok.com/i18n/pixel/events.js");
  });

  it("échappe le slug dans l'écouteur client", () => {
    const scripts = scriptsClientSuivi('le"port', consentementTout());
    expect(scripts[0]).toContain('"le\\"port"');
    expect(scripts[0]).not.toContain('"le"port"');
  });
});
