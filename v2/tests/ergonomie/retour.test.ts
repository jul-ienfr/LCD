import { describe, expect, it } from "vitest";

import { LANGUES } from "../../src/lib/i18n";
import {
  libelleObstacleRetour,
  libelleParcoursRetour,
  traductionsRetour,
} from "../../src/lib/i18n/public/retour";
import {
  OBSTACLES_RETOUR,
  PARCOURS_RETOUR,
  SUPPORTS_RETOUR,
  metadonneesRetour,
  validerRetour,
} from "../../src/lib/mesure/retour";

describe("retour qualitatif (T094)", () => {
  it("refuse un parcours manquant", () => {
    const resultat = validerRetour({ parcours: "", note: "5" });
    expect(resultat.ok).toBe(false);
    if (!resultat.ok) expect(resultat.erreurs.parcours).toBe("requis");
  });

  it("refuse un parcours inconnu", () => {
    const resultat = validerRetour({ parcours: "P-INCONNU", note: "5" });
    expect(resultat.ok).toBe(false);
    if (!resultat.ok) expect(resultat.erreurs.parcours).toBe("inconnu");
  });

  it("refuse une note absente ou hors bornes", () => {
    const absente = validerRetour({ parcours: "P-RESA", note: "" });
    expect(absente.ok).toBe(false);
    if (!absente.ok) expect(absente.erreurs.note).toBe("requise");

    for (const note of ["0", "8", "3.5"]) {
      const resultat = validerRetour({ parcours: "P-RESA", note });
      expect(resultat.ok).toBe(false);
      if (!resultat.ok) expect(resultat.erreurs.note).toBe("hors_bornes");
    }
  });

  it("accepte un retour minimal et ignore les obstacles inconnus", () => {
    const resultat = validerRetour({
      parcours: "P-SEJOUR",
      note: "7",
      obstacles: ["langue", "inexistant", "langue"],
    });
    expect(resultat.ok).toBe(true);
    if (resultat.ok) {
      expect(resultat.valeur.parcours).toBe("P-SEJOUR");
      expect(resultat.valeur.note).toBe(7);
      expect(resultat.valeur.obstacles).toEqual(["langue"]);
      expect(resultat.valeur.support).toBeNull();
    }
  });

  it("ne stocke que des valeurs fermées (aucun texte libre)", () => {
    const resultat = validerRetour({
      parcours: "P-RESA",
      note: 4,
      obstacles: ["affichage"],
      support: "telephone",
    });
    expect(resultat.ok).toBe(true);
    if (!resultat.ok) return;

    const metadonnees = metadonneesRetour(resultat.valeur);
    expect(metadonnees).toEqual({
      parcoursId: "P-RESA",
      note: 4,
      obstacles: "affichage",
      nombreObstacles: 1,
      support: "telephone",
    });
    for (const valeur of Object.values(metadonnees)) {
      expect(typeof valeur).not.toBe("object");
    }
  });

  it("expose les cinq langues avec les mêmes clés et aucun libellé vide", () => {
    const reference = Object.keys(traductionsRetour("fr")).sort();
    for (const langue of LANGUES) {
      const traductions = traductionsRetour(langue);
      expect(Object.keys(traductions).sort()).toEqual(reference);
      for (const valeur of Object.values(traductions)) {
        expect(valeur.trim().length).toBeGreaterThan(0);
      }
      for (const parcours of PARCOURS_RETOUR) {
        expect(libelleParcoursRetour(langue, parcours).length).toBeGreaterThan(0);
      }
      for (const obstacle of OBSTACLES_RETOUR) {
        expect(libelleObstacleRetour(langue, obstacle).length).toBeGreaterThan(0);
      }
    }
  });

  it("replie sur le français pour une langue inconnue", () => {
    expect(traductionsRetour("xx").titre).toBe(traductionsRetour("fr").titre);
    expect(libelleParcoursRetour("xx" as never, "P-RESA")).toBe("Réserver un séjour");
  });

  it("propose une échelle SEQ complète et des supports fermés", () => {
    expect(PARCOURS_RETOUR).toHaveLength(6);
    expect(SUPPORTS_RETOUR).toEqual(["telephone", "tablette", "ordinateur"]);
    expect(OBSTACLES_RETOUR).toContain("autre");
  });
});
