import { describe, expect, it } from "vitest";
import {
  contraste,
  couleurHexValide,
  couleurSurAccent,
} from "@/domain/apparence/contraste";
import { THEMES, THEME_DEFAUT, themeParId } from "@/domain/apparence/registre";
import {
  accentValidePourTheme,
  normaliserApparence,
} from "@/domain/apparence/validation";

describe("registre des apparences", () => {
  it("expose six thèmes uniques et un défaut valide", () => {
    expect(THEMES).toHaveLength(6);
    expect(new Set(THEMES.map((theme) => theme.id)).size).toBe(6);
    expect(themeParId(THEME_DEFAUT)).toBeDefined();
  });

  it("fournit des palettes complètes et des variantes connues", () => {
    for (const theme of THEMES) {
      for (const palette of [theme.clair, theme.sombre]) {
        for (const couleur of Object.values(palette)) {
          expect(couleurHexValide(couleur)).toBe(true);
        }
      }
      expect(["pilule", "souligne", "bloc"]).toContain(theme.variantes.nav);
      expect(["gauche", "centre", "editorial"]).toContain(
        theme.variantes.entete,
      );
    }
  });

  it("respecte AA pour le texte et l’accent sur les surfaces", () => {
    for (const theme of THEMES) {
      for (const [mode, palette] of [
        ["clair", theme.clair],
        ["sombre", theme.sombre],
      ] as const) {
        for (const surface of [palette.fond, palette.surface, palette.surface2]) {
          for (const encre of [
            palette.encre,
            palette.encreDouce,
            palette.encreFaine,
          ]) {
            expect(
              contraste(encre, surface),
              `${theme.id}/${mode} ${encre} sur ${surface}`,
            ).toBeGreaterThanOrEqual(4.5);
          }
          expect(
            contraste(palette.accent, surface),
            `${theme.id}/${mode} accent sur ${surface}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
        expect(contraste(palette.accentFonce, palette.surface)).toBeGreaterThanOrEqual(
          4.5,
        );
        expect(couleurSurAccent(palette.accent)).toMatch(/^#(ffffff|0b0e14)$/);
      }
    }
  });
});

describe("validation de l’apparence", () => {
  it("accepte un accent lisible pour chaque thème", () => {
    for (const theme of THEMES) {
      expect(accentValidePourTheme("#0e7c6b", theme)).toBe(true);
    }
  });

  it("rejette un accent trop clair", () => {
    for (const theme of THEMES) {
      expect(accentValidePourTheme("#fef08a", theme)).toBe(false);
    }
  });

  it("normalise un thème inconnu vers le défaut", () => {
    const apparence = normaliserApparence({
      themeId: "inconnu",
      accent: "red;}",
      identite: { nom: "<script>alert(1)</script>" },
    });
    expect(apparence.themeId).toBe(THEME_DEFAUT);
    expect(apparence.accent).toBeNull();
    expect(apparence.identite.nom).toBe("LCD Parc");
  });

  it("nettoie les URL de logo et les contacts", () => {
    const apparence = normaliserApparence({
      themeId: "ocean",
      identite: {
        nom: "Maison Test",
        logoUrl: "javascript:alert(1)",
        emailContact: "PAS-UN-EMAIL",
        telephoneContact: "+33 6 12 34 56 78",
      },
    });
    expect(apparence.identite.logoUrl).toBeNull();
    expect(apparence.identite.emailContact).toBeNull();
    expect(apparence.identite.telephoneContact).toBe("+33 6 12 34 56 78");
  });
});
