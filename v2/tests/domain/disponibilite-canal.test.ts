import { describe, expect, it } from "vitest";
import {
  appliquerBuffer,
  exclureFlux,
} from "@/domain/disponibilite-canal";
import type { EvenementIcs } from "@/domain/ics-export";

const evenements: EvenementIcs[] = [
  {
    uid: "resa-1@lcd-parc",
    debut: "2026-02-27",
    fin: "2026-03-01",
    titre: "Réservation A",
  },
  {
    uid: "blocage-1@lcd-parc",
    debut: "2026-03-10",
    fin: "2026-03-12",
    titre: "Indisponible",
  },
];

describe("disponibilité par canal", () => {
  it("étend la fin de chaque événement du buffer", () => {
    const resultat = appliquerBuffer(evenements, 1);
    expect(resultat[0]?.fin).toBe("2026-03-02");
    expect(resultat[1]?.fin).toBe("2026-03-13");
  });

  it("ne modifie pas les événements d’origine", () => {
    const resultat = appliquerBuffer(evenements, 2);
    expect(evenements[0]?.fin).toBe("2026-03-01");
    expect(resultat[0]?.fin).toBe("2026-03-03");
  });

  it("retourne une copie sans buffer", () => {
    const resultat = appliquerBuffer(evenements, 0);
    expect(resultat).toEqual(evenements);
    expect(resultat).not.toBe(evenements);
    expect(resultat[0]).not.toBe(evenements[0]);
  });

  it("refuse un buffer hors bornes", () => {
    expect(() => appliquerBuffer(evenements, -1)).toThrow();
    expect(() => appliquerBuffer(evenements, 8)).toThrow();
    expect(() => appliquerBuffer(evenements, 1.5)).toThrow();
  });

  it("retire les événements du flux cible pour éviter l’écho OTA", () => {
    const elements = [
      { ref: "airbnb", fluxIcsId: "flux-airbnb" },
      { ref: "booking", fluxIcsId: "flux-booking" },
      { ref: "direct", fluxIcsId: null },
    ];
    expect(exclureFlux(elements, "flux-airbnb").map((e) => e.ref)).toEqual([
      "booking",
      "direct",
    ]);
    expect(exclureFlux(elements, null)).toHaveLength(3);
  });
});
