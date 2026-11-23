import { describe, expect, it } from "vitest";
import {
  DUREES_PREVUES_MINUTES,
  TOLERANCE_AVANCE_MS,
  TOLERANCE_RETARD_MS,
  dureePrevueMinutes,
  dureeReelleMinutes,
  ecartDureeMinutes,
  etatPointage,
  formaterDuree,
  formaterEcart,
  horodatageLocalValide,
} from "@/domain/pointage";

const MAINTENANT = new Date("2026-11-23T10:00:00Z");

describe("pointage — durées prévues", () => {
  it("couvre les quatre types de mission", () => {
    expect(Object.keys(DUREES_PREVUES_MINUTES).sort()).toEqual([
      "accueil",
      "autre",
      "maintenance",
      "menage",
    ]);
  });

  it("applique la surcharge de mission quand elle existe", () => {
    expect(dureePrevueMinutes("menage", null)).toBe(120);
    expect(dureePrevueMinutes("menage", undefined)).toBe(120);
    expect(dureePrevueMinutes("menage", 45)).toBe(45);
    expect(dureePrevueMinutes("accueil", null)).toBe(30);
  });
});

describe("pointage — horodatage local hors ligne", () => {
  it("accepte l’absence d’horodatage (le serveur horodate)", () => {
    expect(horodatageLocalValide(null, MAINTENANT)).toBe(true);
    expect(horodatageLocalValide("", MAINTENANT)).toBe(true);
    expect(horodatageLocalValide("   ", MAINTENANT)).toBe(true);
    expect(horodatageLocalValide(undefined, MAINTENANT)).toBe(true);
  });

  it("refuse une valeur illisible", () => {
    expect(horodatageLocalValide("hier matin", MAINTENANT)).toBe(false);
  });

  it("tolère une petite avance d’horloge client", () => {
    const deuxMinPlusTard = new Date(MAINTENANT.getTime() + 2 * 60_000).toISOString();
    expect(horodatageLocalValide(deuxMinPlusTard, MAINTENANT)).toBe(true);
  });

  it("refuse un horodatage client trop en avance", () => {
    const dixMinPlusTard = new Date(MAINTENANT.getTime() + 10 * 60_000).toISOString();
    expect(horodatageLocalValide(dixMinPlusTard, MAINTENANT)).toBe(false);
  });

  it("accepte un pointage vieux de moins de sept jours, refuse au-delà", () => {
    const sixJours = new Date(MAINTENANT.getTime() - 6 * 24 * 3600_000).toISOString();
    const huitJours = new Date(MAINTENANT.getTime() - 8 * 24 * 3600_000).toISOString();
    expect(horodatageLocalValide(sixJours, MAINTENANT)).toBe(true);
    expect(horodatageLocalValide(huitJours, MAINTENANT)).toBe(false);
  });

  it("encadre les bornes exactes", () => {
    const limiteAvance = new Date(MAINTENANT.getTime() + TOLERANCE_AVANCE_MS).toISOString();
    const limiteRetard = new Date(MAINTENANT.getTime() - TOLERANCE_RETARD_MS).toISOString();
    expect(horodatageLocalValide(limiteAvance, MAINTENANT)).toBe(true);
    expect(horodatageLocalValide(limiteRetard, MAINTENANT)).toBe(true);
  });
});

describe("pointage — durées réelles et écarts", () => {
  it("calcule la durée réelle en minutes entières", () => {
    const debut = new Date("2026-11-23T08:00:00Z");
    expect(dureeReelleMinutes(debut, new Date("2026-11-23T09:30:00Z"))).toBe(90);
    expect(dureeReelleMinutes(debut, debut)).toBe(0);
  });

  it("ne produit jamais de durée négative", () => {
    const debut = new Date("2026-11-23T09:30:00Z");
    expect(dureeReelleMinutes(debut, new Date("2026-11-23T09:00:00Z"))).toBe(0);
  });

  it("arrondit à la minute la plus proche", () => {
    const debut = new Date("2026-11-23T09:00:00Z");
    expect(dureeReelleMinutes(debut, new Date(debut.getTime() + 89_700))).toBe(1);
    expect(dureeReelleMinutes(debut, new Date(debut.getTime() + 90_300))).toBe(2);
  });

  it("signe l’écart dans les deux sens", () => {
    expect(ecartDureeMinutes(90, 120)).toBe(-30);
    expect(ecartDureeMinutes(150, 120)).toBe(30);
    expect(ecartDureeMinutes(120, 120)).toBe(0);
  });
});

describe("pointage — état", () => {
  const vide = {
    debutReel: null,
    finReelle: null,
    debutReelSource: null,
    finReelleSource: null,
    debutReelRecuLe: null,
    finReelleRecuLe: null,
  };

  it("distingue non commencé, en cours et terminé", () => {
    expect(etatPointage(vide)).toBe("non_commence");
    expect(
      etatPointage({ ...vide, debutReel: new Date("2026-11-23T08:00:00Z") }),
    ).toBe("en_cours");
    expect(
      etatPointage({
        ...vide,
        debutReel: new Date("2026-11-23T08:00:00Z"),
        finReelle: new Date("2026-11-23T10:00:00Z"),
      }),
    ).toBe("termine");
  });
});

describe("pointage — formatage", () => {
  it("formate les durées en heures et minutes", () => {
    expect(formaterDuree(0)).toBe("0 min");
    expect(formaterDuree(45)).toBe("45 min");
    expect(formaterDuree(60)).toBe("1 h");
    expect(formaterDuree(95)).toBe("1 h 35");
    expect(formaterDuree(125)).toBe("2 h 05");
  });

  it("formate l’écart signé", () => {
    expect(formaterEcart(0)).toBe("à l’heure");
    expect(formaterEcart(12)).toBe("+12 min");
    expect(formaterEcart(-8)).toBe("-8 min");
    expect(formaterEcart(-90)).toBe("-1 h 30");
  });
});
