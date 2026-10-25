import { describe, expect, it } from "vitest";
import {
  avancementMenage,
  refMenageValide,
  statutMenageValide,
  tachesParDefaut,
  TACHES_MENAGE_DEFAUT,
  validerMenage,
  validerTaches,
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
});
