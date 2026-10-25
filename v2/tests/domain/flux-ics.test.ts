import { describe, expect, it } from "vitest";
import {
  libelleFluxValide,
  urlIcsValide,
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
    expect(urlIcsValide("https://127.0.0.1/calendar.ics")).toBe(false);
    expect(urlIcsValide("https://10.0.0.1/calendar.ics")).toBe(false);
    expect(urlIcsValide("https://192.168.1.10/calendar.ics")).toBe(false);
    expect(urlIcsValide("https://172.20.0.1/calendar.ics")).toBe(false);
    expect(urlIcsValide("https://box.local/calendar.ics")).toBe(false);
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
