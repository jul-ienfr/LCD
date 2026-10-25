import { describe, expect, it } from "vitest";
import { genererCalendrierIcs } from "@/domain/ics-export";

describe("export ICS", () => {
  it("génère un calendrier avec un événement toute la journée", () => {
    const ics = genererCalendrierIcs(
      "Villa Test",
      [
        {
          uid: "resa-1@lcd-parc",
          debut: "2026-11-15",
          fin: "2026-11-18",
          titre: "Réservation R1",
          description: "Source : import-ics",
        },
      ],
      new Date("2026-10-25T10:00:00.000Z"),
    );

    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTAMP:20261025T100000Z");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261115");
    expect(ics).toContain("DTEND;VALUE=DATE:20261118");
    expect(ics).toContain("SUMMARY:Réservation R1");
    expect(ics).toContain("STATUS:CONFIRMED");
    expect(ics).toContain("X-WR-CALNAME:LCD Parc — Villa Test");
  });

  it("échappe les caractères réservés", () => {
    const ics = genererCalendrierIcs("A;B,C\\D", [
      {
        uid: "resa-2@lcd-parc",
        debut: "2026-11-15",
        fin: "2026-11-18",
        titre: "Séjour; test, ligne\nsuivante",
        statut: "TENTATIVE",
      },
    ]);

    expect(ics).toContain("SUMMARY:Séjour\\; test\\, ligne\\nsuivante");
    expect(ics).toContain("STATUS:TENTATIVE");
  });

  it("ignore les dates invalides ou les séjours vides", () => {
    const ics = genererCalendrierIcs("Villa", [
      {
        uid: "bad-1@lcd-parc",
        debut: "2026-11-18",
        fin: "2026-11-18",
        titre: "Vide",
      },
      {
        uid: "bad-2@lcd-parc",
        debut: "18/11/2026",
        fin: "2026-11-20",
        titre: "Format",
      },
    ]);

    expect(ics).not.toContain("BEGIN:VEVENT");
  });

  it("plie les lignes à 75 octets", () => {
    const ics = genererCalendrierIcs(
      "Villa",
      [
        {
          uid: "resa-3@lcd-parc",
          debut: "2026-11-15",
          fin: "2026-11-18",
          titre: "X".repeat(100),
        },
      ],
    );
    const lignes = ics.split("\r\n");
    for (const ligne of lignes) {
      expect(Buffer.byteLength(ligne, "utf8")).toBeLessThanOrEqual(75);
    }
    expect(ics).toContain("\r\n ");
  });
});
