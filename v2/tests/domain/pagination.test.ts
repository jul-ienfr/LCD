/**
 * FR-026 (spec 006) — bornes de pagination appliquées avant le SQL.
 *
 * Les listes ne doivent jamais charger un tenant entier : ces règles sont
 * la seule source des `limit`/`offset` envoyés à la base. On fige les cas
 * limites (page négative, taille énorme, total nul) qui produiraient sinon
 * une requête non bornée.
 */
import { describe, expect, it } from "vitest";
import {
  bornerPage,
  nombreDePages,
  TAILLE_PAGE_DEFAUT,
  TAILLE_PAGE_MAX,
} from "@/domain/pagination";

describe("bornerPage", () => {
  it("traduit une page normale en décalage SQL", () => {
    expect(bornerPage(1, 50)).toEqual({ page: 1, taille: 50, decalage: 0 });
    expect(bornerPage(3, 20)).toEqual({ page: 3, taille: 20, decalage: 40 });
  });

  it("ramène une page absente ou aberrante à la première page", () => {
    expect(bornerPage(undefined).page).toBe(1);
    expect(bornerPage(0)).toEqual({
      page: 1,
      taille: TAILLE_PAGE_DEFAUT,
      decalage: 0,
    });
    expect(bornerPage(-7).page).toBe(1);
    expect(bornerPage(Number.NaN).page).toBe(1);
  });

  it("plafonne la taille pour qu'une page ne charge jamais tout le tenant", () => {
    expect(bornerPage(1, 10_000).taille).toBe(TAILLE_PAGE_MAX);
    expect(bornerPage(1, 0).taille).toBe(1);
    expect(bornerPage(1, -4).taille).toBe(1);
  });

  it("tronque une page décimale", () => {
    expect(bornerPage(2.9, 10.7)).toEqual({
      page: 2,
      taille: 10,
      decalage: 10,
    });
  });
});

describe("nombreDePages", () => {
  it("compte au moins une page, même vide", () => {
    expect(nombreDePages(0, 50)).toBe(1);
    expect(nombreDePages(1, 50)).toBe(1);
    expect(nombreDePages(50, 50)).toBe(1);
    expect(nombreDePages(51, 50)).toBe(2);
  });

  it("ne divise jamais par zéro", () => {
    expect(nombreDePages(10, 0)).toBe(10);
  });
});
