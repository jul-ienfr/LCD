import { describe, expect, it } from "vitest";
import {
  calculerProchainEssai,
  fluxDu,
  fluxEnRetard,
  libelleFluxValide,
  urlIcsValide,
  type FluxIcs,
} from "@/domain/flux-ics";

describe("flux ICS", () => {
  it("accepte une URL HTTPS publique", () => {
    expect(
      urlIcsValide("https://www.airbnb.fr/calendar/ical/12345678.ics"),
    ).toBe(true);
    expect(urlIcsValide("https://ical.booking.com/v1/export?t=abc")).toBe(true);
  });

  it("refuse HTTP, localhost, IP privées et .local", () => {
    expect(urlIcsValide("http://www.airbnb.fr/calendar.ics")).toBe(false);
    expect(urlIcsValide("https://localhost/calendar.ics")).toBe(false);
    expect(urlIcsValide("https://localhost./calendar.ics")).toBe(false);
    expect(urlIcsValide("https://127.0.0.1/calendar.ics")).toBe(false);
    expect(urlIcsValide("https://10.0.0.1/calendar.ics")).toBe(false);
    expect(urlIcsValide("https://192.168.1.10/calendar.ics")).toBe(false);
    expect(urlIcsValide("https://172.20.0.1/calendar.ics")).toBe(false);
    expect(urlIcsValide("https://box.local/calendar.ics")).toBe(false);
    expect(urlIcsValide("https://[::1]/calendar.ics")).toBe(false);
    expect(urlIcsValide("https://[fc00::1]/calendar.ics")).toBe(false);
    expect(urlIcsValide("https://user:pass@example.com/calendar.ics")).toBe(
      false,
    );
    expect(urlIcsValide("pas une url")).toBe(false);
  });

  it("valide le libellé", () => {
    expect(libelleFluxValide("Airbnb")).toBe(true);
    expect(libelleFluxValide("A")).toBe(false);
    expect(libelleFluxValide("")).toBe(false);
  });
});

function flux(partial: Partial<FluxIcs> = {}): FluxIcs {
  return {
    id: "f1",
    tenantId: "t1",
    logementId: "l1",
    canalId: null,
    libelle: "Airbnb",
    url: "https://example.com/calendar.ics",
    actif: true,
    intervalleMinutes: 5,
    derniereSync: null,
    derniereTentative: null,
    prochainEssai: null,
    dernierStatut: null,
    dernierMessage: null,
    echecsConsecutifs: 0,
    videsConsecutifs: 0,
    etag: null,
    derniereModification: null,
    empreinte: null,
    createdAt: new Date("2026-10-25T10:00:00.000Z"),
    updatedAt: new Date("2026-10-25T10:00:00.000Z"),
    ...partial,
  };
}

describe("planification des flux", () => {
  it("considère dû un flux jamais planifié ou échu", () => {
    const maintenant = new Date("2026-10-25T10:00:00.000Z");
    expect(fluxDu(flux(), maintenant)).toBe(true);
    expect(
      fluxDu(
        flux({ prochainEssai: new Date("2026-10-25T09:59:00.000Z") }),
        maintenant,
      ),
    ).toBe(true);
    expect(
      fluxDu(
        flux({ prochainEssai: new Date("2026-10-25T10:05:00.000Z") }),
        maintenant,
      ),
    ).toBe(false);
  });

  it("applique un backoff exponentiel plafonné", () => {
    const maintenant = new Date("2026-10-25T10:00:00.000Z");
    const sansJitter = () => 0.5;
    const prochain = calculerProchainEssai({
      maintenant,
      intervalleMinutes: 5,
      echecsConsecutifs: 4,
      aleatoire: sansJitter,
    });
    expect(prochain.getTime() - maintenant.getTime()).toBe(40 * 60_000);

    const plafond = calculerProchainEssai({
      maintenant,
      intervalleMinutes: 5,
      echecsConsecutifs: 10,
      aleatoire: sansJitter,
    });
    expect(plafond.getTime() - maintenant.getTime()).toBe(60 * 60_000);
  });

  it("détecte un flux silencieux au-delà de l’intervalle + tolérance", () => {
    const maintenant = new Date("2026-10-25T10:00:00.000Z");
    expect(
      fluxEnRetard(
        flux({ derniereTentative: new Date("2026-10-25T09:40:00.000Z") }),
        maintenant,
      ),
    ).toBe(true);
    expect(
      fluxEnRetard(
        flux({ derniereTentative: new Date("2026-10-25T09:55:00.000Z") }),
        maintenant,
      ),
    ).toBe(false);
  });
});
