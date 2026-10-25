import { describe, expect, it } from "vitest";
import {
  conformiteAnnonce,
  MENTIONS_ANNONCE,
  mentionsManquantes,
  mentionsParDefaut,
  normaliserConformite,
  TOTAL_MENTIONS,
} from "@/domain/annonce";
import { ErreurMetier } from "@/domain/erreurs";

const toutesCochees = Object.fromEntries(
  MENTIONS_ANNONCE.map((m) => [m.code, true]),
);

describe("domaine conformité annonce", () => {
  it("expose neuf mentions obligatoires uniques", () => {
    expect(MENTIONS_ANNONCE).toHaveLength(9);
    expect(TOTAL_MENTIONS).toBe(9);
    const codes = new Set(MENTIONS_ANNONCE.map((m) => m.code));
    expect(codes.size).toBe(9);
    expect(mentionsManquantes(mentionsParDefaut())).toHaveLength(9);
  });

  it("normalise les mentions et étiquettes", () => {
    const valeurs = normaliserConformite({
      mentions: { ...toutesCochees, inconnue: true, surface: false },
      dpeClasse: " d ",
      gesClasse: "b",
      classement: "3_etoiles",
      numeroEnregistrement: " 06088202600012 ",
      numeroCerfa: "",
    });
    expect(valeurs.mentions.surface).toBe(false);
    expect(valeurs.mentions.inconnue).toBeUndefined();
    expect(valeurs.dpeClasse).toBe("D");
    expect(valeurs.gesClasse).toBe("B");
    expect(valeurs.classement).toBe("3_etoiles");
    expect(valeurs.numeroEnregistrement).toBe("06088202600012");
    expect(valeurs.numeroCerfa).toBeNull();
  });

  it("refuse les étiquettes et classements invalides", () => {
    expect(() =>
      normaliserConformite({ mentions: toutesCochees, dpeClasse: "H" }),
    ).toThrow(ErreurMetier);
    expect(() =>
      normaliserConformite({ mentions: toutesCochees, gesClasse: "ZZ" }),
    ).toThrow(ErreurMetier);
    expect(() =>
      normaliserConformite({ mentions: toutesCochees, classement: "6_etoiles" }),
    ).toThrow(ErreurMetier);
    expect(() =>
      normaliserConformite({
        mentions: toutesCochees,
        numeroEnregistrement: "a".repeat(65),
      }),
    ).toThrow(ErreurMetier);
  });

  it("n’est conforme qu’avec les neuf mentions et les deux étiquettes", () => {
    const partiel = conformiteAnnonce({
      mentions: { ...toutesCochees, charges: false },
      dpeClasse: "D",
      gesClasse: "B",
    });
    expect(partiel).toMatchObject({
      faites: 8,
      total: 9,
      pourcentage: 89,
      conforme: false,
    });
    expect(partiel.manquantes.map((m) => m.code)).toEqual(["charges"]);

    const sansEtiquettes = conformiteAnnonce({
      mentions: toutesCochees,
      dpeClasse: null,
      gesClasse: null,
    });
    expect(sansEtiquettes.faites).toBe(9);
    expect(sansEtiquettes.conforme).toBe(false);

    const complet = conformiteAnnonce({
      mentions: toutesCochees,
      dpeClasse: "D",
      gesClasse: "B",
    });
    expect(complet).toMatchObject({
      faites: 9,
      pourcentage: 100,
      conforme: true,
    });
    expect(complet.manquantes).toHaveLength(0);
  });
});
