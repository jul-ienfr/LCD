import { describe, expect, it } from "vitest";
import {
  decalerMois,
  grilleMois,
  joursDuMois,
  moisValide,
} from "@/domain/calendrier";

describe("calendrier", () => {
  it("valide un mois AAAA-MM", () => {
    expect(moisValide("2026-10")).toBe(true);
    expect(moisValide("2026-13")).toBe(false);
    expect(moisValide("2026-1")).toBe(false);
  });

  it("liste les jours d'un mois", () => {
    expect(joursDuMois("2026-02")).toHaveLength(28);
    expect(joursDuMois("2028-02")).toHaveLength(29);
    expect(joursDuMois("2026-10")[0]).toBe("2026-10-01");
    expect(joursDuMois("2026-10").at(-1)).toBe("2026-10-31");
  });

  it("décale les mois", () => {
    expect(decalerMois("2026-01", -1)).toBe("2025-12");
    expect(decalerMois("2026-12", 1)).toBe("2027-01");
  });

  it("construit une grille lundi→dimanche", () => {
    const grille = grilleMois("2026-10");
    expect(grille.length).toBeGreaterThanOrEqual(4);
    expect(grille.every((semaine) => semaine.length === 7)).toBe(true);
    // 1er octobre 2026 = jeudi → 3 cases vides avant.
    expect(grille[0]?.slice(0, 3)).toEqual([null, null, null]);
    expect(grille[0]?.[3]).toBe("2026-10-01");
  });
});
