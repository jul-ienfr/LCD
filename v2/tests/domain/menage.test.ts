import { describe, expect, it } from "vitest";
import {
  avancementMenage,
  refMenageValide,
  statistiquesMenage,
  statutMenageValide,
  tachesParDefaut,
  TACHES_MENAGE_DEFAUT,
  validerEvaluationMenage,
  validerMenage,
  validerTaches,
  type Menage,
} from "@/domain/menage";
import { ErreurMetier } from "@/domain/erreurs";

describe("domaine ménage", () => {
  it("valide la référence et le statut", () => {
    expect(refMenageValide("men-1234")).toBe(true);
    expect(refMenageValide("ab")).toBe(false);
    expect(refMenageValide("men 1234")).toBe(false);
    expect(statutMenageValide("planifie")).toBe(true);
    expect(statutMenageValide("fait")).toBe(true);
    expect(statutMenageValide("en cours")).toBe(false);
  });

  it("fournit une checklist par défaut non cochée", () => {
    const taches = tachesParDefaut();
    expect(taches).toHaveLength(TACHES_MENAGE_DEFAUT.length);
    expect(taches.every((t) => t.fait === false)).toBe(true);
  });

  it("normalise et valide les tâches", () => {
    expect(
      validerTaches([
        { libelle: "  Sols  " },
        { libelle: "Vitres", fait: true },
      ]),
    ).toEqual([
      { libelle: "Sols", fait: false },
      { libelle: "Vitres", fait: true },
    ]);
    expect(() => validerTaches([])).toThrow(ErreurMetier);
    expect(() => validerTaches([{ libelle: "a" }])).toThrow(ErreurMetier);
  });

  it("valide la date et les notes", () => {
    const valide = validerMenage({
      date: "2026-10-25",
      notes: "  Draps propres  ",
    });
    expect(valide.notes).toBe("Draps propres");
    expect(valide.taches).toHaveLength(TACHES_MENAGE_DEFAUT.length);
    expect(() => validerMenage({ date: "25/10/2026" })).toThrow(ErreurMetier);
    expect(() =>
      validerMenage({ date: "2026-10-25", notes: "a".repeat(2001) }),
    ).toThrow(ErreurMetier);
  });

  it("calcule l’avancement", () => {
    const taches = validerTaches([
      { libelle: "Sols", fait: true },
      { libelle: "Vitres", fait: true },
      { libelle: "Cuisine", fait: false },
    ]);
    expect(avancementMenage(taches)).toEqual({
      faites: 2,
      total: 3,
      pourcentage: 67,
    });
    expect(avancementMenage([])).toEqual({
      faites: 0,
      total: 0,
      pourcentage: 0,
    });
  });

  it("valide l’évaluation de rotation", () => {
    expect(
      validerEvaluationMenage({
        score: 4,
        coutCentimes: 4500,
        dureeMinutes: 90,
      }),
    ).toEqual({ score: 4, coutCentimes: 4500, dureeMinutes: 90 });
    expect(
      validerEvaluationMenage({
        score: null,
        coutCentimes: null,
        dureeMinutes: 45,
      }),
    ).toEqual({ score: null, coutCentimes: null, dureeMinutes: 45 });
    expect(() =>
      validerEvaluationMenage({
        score: 6,
        coutCentimes: null,
        dureeMinutes: null,
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerEvaluationMenage({
        score: 3,
        coutCentimes: -1,
        dureeMinutes: null,
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerEvaluationMenage({
        score: null,
        coutCentimes: null,
        dureeMinutes: 0,
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerEvaluationMenage({
        score: null,
        coutCentimes: null,
        dureeMinutes: null,
      }),
    ).toThrow(ErreurMetier);
  });

  it("agrège score, coût et durée avec alerte qualité", () => {
    function menageAvec(
      score: number | null,
      coutCentimes: number | null,
      dureeMinutes: number | null,
    ): Menage {
      const maintenant = new Date();
      return {
        id: crypto.randomUUID(),
        tenantId: "t1",
        logementId: "l1",
        reservationId: null,
        ref: "men-1",
        date: "2026-10-25",
        statut: "fait",
        notes: "",
        score,
        coutCentimes,
        dureeMinutes,
        taches: [],
        createdAt: maintenant,
        updatedAt: maintenant,
      };
    }

    const stats = statistiquesMenage([
      menageAvec(4, 4000, 80),
      menageAvec(2, 6000, 100),
    ]);
    expect(stats.scoreMoyen).toBe(3);
    expect(stats.coutMoyenCentimes).toBe(5000);
    expect(stats.dureeMoyenneMinutes).toBe(90);
    expect(stats.alerteQualite).toBe(true);

    expect(statistiquesMenage([menageAvec(5, null, null)])).toEqual({
      scoreMoyen: 5,
      coutMoyenCentimes: null,
      dureeMoyenneMinutes: null,
      alerteQualite: false,
    });
    expect(statistiquesMenage([])).toEqual({
      scoreMoyen: null,
      coutMoyenCentimes: null,
      dureeMoyenneMinutes: null,
      alerteQualite: false,
    });
  });
});
