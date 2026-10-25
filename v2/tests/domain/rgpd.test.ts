import { describe, expect, it } from "vitest";
import {
  completudeRegistre,
  DUREE_RGPD_MAX_MOIS,
  entreesParDefaut,
  normaliserRegistre,
  TRAITEMENTS_RGPD,
  validerEntrees,
} from "@/domain/rgpd";
import { ErreurMetier } from "@/domain/erreurs";

describe("domaine registre RGPD", () => {
  it("catalogue sept traitements documentés", () => {
    expect(TRAITEMENTS_RGPD).toHaveLength(7);
    expect(new Set(TRAITEMENTS_RGPD.map((t) => t.code)).size).toBe(7);
    for (const traitement of TRAITEMENTS_RGPD) {
      expect(traitement.finalite.length).toBeGreaterThan(10);
      expect(traitement.baseLegale.length).toBeGreaterThan(2);
      expect(traitement.donnees.length).toBeGreaterThan(0);
      expect(traitement.dureeMoisParDefaut).toBeGreaterThan(0);
    }
    const defauts = entreesParDefaut();
    expect(Object.keys(defauts)).toHaveLength(7);
    expect(defauts.reservations).toEqual({
      actif: true,
      dureeMois: 36,
      notes: "",
    });
  });

  it("valide les durées et les notes", () => {
    expect(() =>
      validerEntrees({ reservations: { actif: true, dureeMois: 0 } }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerEntrees({
        reservations: {
          actif: true,
          dureeMois: DUREE_RGPD_MAX_MOIS + 1,
        },
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerEntrees({
        reservations: { actif: true, dureeMois: 2.5 },
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerEntrees({
        reservations: { actif: true, dureeMois: 12, notes: "a".repeat(501) },
      }),
    ).toThrow(ErreurMetier);

    const normalisees = validerEntrees({
      reservations: { actif: true, dureeMois: 12, notes: "  test  " },
    });
    expect(normalisees.reservations).toEqual({
      actif: true,
      dureeMois: 12,
      notes: "test",
    });
    expect(normalisees.facturation!.actif).toBe(false);
  });

  it("normalise le DPO et l’hébergement", () => {
    const registre = normaliserRegistre({
      dpoNom: "  Camille Martin ",
      dpoContact: " dpo@exemple.fr ",
      hebergement: " UE — Paris ",
      entrees: { reservations: { actif: true, dureeMois: 12 } },
    });
    expect(registre.dpoNom).toBe("Camille Martin");
    expect(registre.dpoContact).toBe("dpo@exemple.fr");
    expect(registre.hebergement).toBe("UE — Paris");
    expect(registre.entrees.reservations!.dureeMois).toBe(12);

    expect(() =>
      normaliserRegistre({ hebergement: " ", entrees: {} }),
    ).toThrow(ErreurMetier);
    expect(() =>
      normaliserRegistre({ hebergement: "UE", dpoNom: "a".repeat(121), entrees: {} }),
    ).toThrow(ErreurMetier);
  });

  it("calcule la complétude du registre", () => {
    const entrees = entreesParDefaut();
    const complet = completudeRegistre({
      dpoContact: "dpo@exemple.fr",
      hebergement: "Union européenne",
      entrees,
    });
    expect(complet).toMatchObject({
      actifs: 7,
      documentes: 7,
      pourcentage: 100,
      complet: true,
    });

    const sansContact = completudeRegistre({
      dpoContact: null,
      hebergement: "Union européenne",
      entrees,
    });
    expect(sansContact.complet).toBe(false);

    const partiel = completudeRegistre({
      dpoContact: "dpo@exemple.fr",
      hebergement: "Union européenne",
      entrees: {
        ...entrees,
        avis: { actif: true, dureeMois: 0, notes: "" },
        support: { actif: false, dureeMois: 36, notes: "" },
      },
    });
    expect(partiel.actifs).toBe(6);
    expect(partiel.documentes).toBe(5);
    expect(partiel.pourcentage).toBe(83);
    expect(partiel.manquants.map((t) => t.code)).toEqual(["avis"]);

    const aucun = completudeRegistre({
      dpoContact: "dpo@exemple.fr",
      hebergement: "UE",
      entrees: Object.fromEntries(
        TRAITEMENTS_RGPD.map((t) => [
          t.code,
          { actif: false, dureeMois: 12, notes: "" },
        ]),
      ),
    });
    expect(aucun).toMatchObject({
      actifs: 0,
      pourcentage: 0,
      complet: false,
    });
  });
});
