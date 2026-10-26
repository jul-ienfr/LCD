import { describe, expect, it } from "vitest";
import {
  libelleFrequenceMenage,
  validerPreferences,
} from "@/domain/preference-sejour";
import { ErreurMetier } from "@/domain/erreurs";

describe("domaine préférences de séjour", () => {
  it("accepte les bornes et libelle la fréquence", () => {
    expect(
      validerPreferences({
        menageFrequenceJ: 0,
        lingeInclus: false,
        heureArrivee: "",
        consignes: "  Lit bébé  ",
      }),
    ).toEqual({
      menageFrequenceJ: 0,
      lingeInclus: false,
      heureArrivee: null,
      consignes: "Lit bébé",
    });
    expect(libelleFrequenceMenage(0)).toBe(
      "Aucun ménage pendant le séjour",
    );
    expect(libelleFrequenceMenage(1)).toBe("Ménage tous les jours");
    expect(libelleFrequenceMenage(7)).toBe("Ménage tous les 7 jours");
  });

  it("refuse une fréquence hors bornes", () => {
    for (const menageFrequenceJ of [-1, 31, 1.5]) {
      expect(() =>
        validerPreferences({
          menageFrequenceJ,
          lingeInclus: true,
          heureArrivee: "",
          consignes: "",
        }),
      ).toThrow(ErreurMetier);
    }
    expect(
      validerPreferences({
        menageFrequenceJ: 30,
        lingeInclus: true,
        heureArrivee: "18:30",
        consignes: "",
      }).heureArrivee,
    ).toBe("18:30");
  });

  it("valide l’heure et la longueur des consignes", () => {
    expect(() =>
      validerPreferences({
        menageFrequenceJ: 7,
        lingeInclus: true,
        heureArrivee: "25:00",
        consignes: "",
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerPreferences({
        menageFrequenceJ: 7,
        lingeInclus: true,
        heureArrivee: "08:00",
        consignes: "a".repeat(501),
      }),
    ).toThrow(ErreurMetier);
  });
});
