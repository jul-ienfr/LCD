import { describe, expect, it } from "vitest";
import {
  avancementFormation,
  avancementGlobal,
  etapesConnues,
  MODULES_FORMATION,
  moduleParCode,
  validerProgression,
} from "@/domain/formation";
import { ErreurMetier } from "@/domain/erreurs";

describe("domaine formation", () => {
  it("expose quatre modules avec des étapes uniques", () => {
    expect(MODULES_FORMATION).toHaveLength(4);
    const modules = new Set<string>();
    for (const moduleFormation of MODULES_FORMATION) {
      expect(modules.has(moduleFormation.code)).toBe(false);
      modules.add(moduleFormation.code);
      expect(moduleFormation.etapes.length).toBeGreaterThanOrEqual(4);
      const etapes = new Set(
        moduleFormation.etapes.map((etape) => etape.code),
      );
      expect(etapes.size).toBe(moduleFormation.etapes.length);
    }
    expect(moduleParCode("securite")?.titre).toBe("Urgences et sécurité");
    expect(moduleParCode("inconnu")).toBeNull();
  });

  it("filtre les étapes inconnues et les doublons", () => {
    const accueil = moduleParCode("accueil");
    if (!accueil) throw new Error("module Accueil manquant");
    expect(
      etapesConnues(accueil, ["guide", "guide", "inventee", "check-in"]),
    ).toEqual(["guide", "check-in"]);
  });

  it("calcule l’avancement d’un module", () => {
    const menage = moduleParCode("menage");
    if (!menage) throw new Error("module Ménage manquant");
    expect(avancementFormation(menage, [])).toEqual({
      faites: 0,
      total: 4,
      pourcentage: 0,
      termine: false,
    });
    expect(avancementFormation(menage, ["checklist"])).toMatchObject({
      faites: 1,
      pourcentage: 25,
      termine: false,
    });
    expect(
      avancementFormation(menage, ["checklist", "degradation", "reassort", "inventaire"]),
    ).toEqual({ faites: 4, total: 4, pourcentage: 100, termine: true });
  });

  it("calcule l’avancement global sur toutes les étapes", () => {
    const total = MODULES_FORMATION.reduce(
      (somme, module) => somme + module.etapes.length,
      0,
    );
    expect(avancementGlobal([])).toEqual({
      faites: 0,
      total,
      pourcentage: 0,
    });
    expect(
      avancementGlobal([
        { moduleCode: "accueil", etapesFaites: ["guide", "check-in"] },
        { moduleCode: "inconnu", etapesFaites: ["x"] },
      ]),
    ).toEqual({ faites: 2, total, pourcentage: Math.round((2 / total) * 100) });
  });

  it("refuse un module inconnu", () => {
    expect(() =>
      validerProgression({ moduleCode: "inconnu", etapesFaites: [] }),
    ).toThrow(ErreurMetier);
  });
});
