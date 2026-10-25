import { describe, expect, it } from "vitest";
import { parserIcs, refDepuisUid } from "@/domain/ics";

const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//FR
BEGIN:VEVENT
UID:abc@airbnb.com
DTSTART;VALUE=DATE:20261220
DTEND;VALUE=DATE:20261223
SUMMARY:Reserved
DESCRIPTION:Guest: Alice Martin\\nGuests: 2\\nTotal: 450.50
END:VEVENT
BEGIN:VEVENT
UID:block-1
DTSTART:20261224T150000Z
DTEND:20261227T110000Z
SUMMARY:Airbnb (Not available)
END:VEVENT
BEGIN:VEVENT
UID:cancelled-1
DTSTART;VALUE=DATE:20261228
DTEND;VALUE=DATE:20261229
SUMMARY:Reserved
STATUS:CANCELLED
END:VEVENT
END:VCALENDAR
`;

describe("parserIcs", () => {
  it("extrait réservations et blocages, ignore les annulations", () => {
    const resultat = parserIcs(ics);
    expect(resultat.evenements).toHaveLength(2);
    expect(resultat.ignores).toBe(1);

    const [reservation, blocage] = resultat.evenements;
    expect(reservation?.type).toBe("reservation");
    expect(reservation?.debut).toBe("2026-12-20");
    expect(reservation?.fin).toBe("2026-12-23");
    expect(reservation?.clientNom).toBe("Alice Martin");
    expect(reservation?.voyageurs).toBe(2);
    expect(reservation?.montantCentimes).toBe(45_050);
    expect(reservation?.ref).toMatch(/^ics-[a-z0-9-]+-[0-9a-f]{8}$/);

    expect(blocage?.type).toBe("blocage");
    expect(blocage?.debut).toBe("2026-12-24");
    expect(blocage?.fin).toBe("2026-12-27");
    expect(blocage?.motif).toContain("Not available");
  });

  it("gère les lignes pliées et les dates sans DTEND", () => {
    const texte = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:fold-1
DTSTART;VALUE=DATE:20270101
DURATION:P2D
SUMMARY:Reserved by a guest with a very long
  summary
END:VEVENT
END:VCALENDAR
`;
    const resultat = parserIcs(texte);
    expect(resultat.evenements).toHaveLength(1);
    expect(resultat.evenements[0]?.fin).toBe("2027-01-03");
    expect(resultat.evenements[0]?.resume).toContain("very long summary");
  });

  it("génère une référence stable et courte", () => {
    const a = refDepuisUid("abc@airbnb.com");
    const b = refDepuisUid("abc@airbnb.com");
    expect(a).toBe(b);
    expect(a.length).toBeLessThanOrEqual(64);
    expect(refDepuisUid("autre")).not.toBe(a);
  });

  it("ignore un calendrier sans événement exploitable", () => {
    const resultat = parserIcs("BEGIN:VCALENDAR\nEND:VCALENDAR\n");
    expect(resultat.evenements).toHaveLength(0);
  });
});
