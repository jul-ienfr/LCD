import { describe, expect, it } from "vitest";
import {
  entreeSuiviDepuisMesure,
  evenementDepuisMesure,
  nombreResultatsBorne,
  roleMesure,
} from "@/lib/mesure/instrumentation";

describe("instrumentation des parcours (T089-T092)", () => {
  it("produit un événement fermé pour une étape vue", () => {
    const evenement = evenementDepuisMesure({
      nom: "etape_vue",
      parcoursId: "P-HOTE-5",
      surface: "staff",
      route: "/hote",
      etape: "ouverture",
      role: "comptable",
      maintenant: new Date("2026-11-20T10:00:00Z"),
    });
    expect(evenement).toMatchObject({
      nom: "etape_vue",
      parcoursId: "P-HOTE-5",
      surface: "staff",
      route: "/hote",
      etape: "ouverture",
      role: "hote",
      version: "2026-11",
      date: "2026-11-20T10:00:00.000Z",
    });
  });

  it("écrit une entrée suivi_evenements sans texte libre", () => {
    const entree = entreeSuiviDepuisMesure({
      nom: "recherche_sans_resultat",
      parcoursId: "P-RECHERCHE",
      surface: "staff",
      route: "/hote/recherche",
      etape: "resultats",
      resultat: "erreur",
      role: "admin",
      nombreResultats: 0,
      maintenant: new Date("2026-11-20T10:00:00Z"),
    });
    expect(entree.nom).toBe("recherche_sans_resultat");
    expect(entree.page).toBe("/hote/recherche");
    // `recherche_*` est projeté sur `autre` : le nom précis reste dans
    // `metadata.evenement`, la colonne `type` ne sert qu'au regroupement.
    expect(entree.type).toBe("autre");
    expect(entree.metadata).toEqual({
      version: "2026-11",
      evenement: "recherche_sans_resultat",
      parcoursId: "P-RECHERCHE",
      surface: "staff",
      date: "2026-11-20T10:00:00.000Z",
      role: "admin",
      etape: "resultats",
      resultat: "erreur",
      nombreResultats: 0,
    });
    // Aucune valeur de metadata ne peut transporter de contenu libre :
    // toutes les clés sont connues et toutes les valeurs sont typées.
    for (const valeur of Object.values(entree.metadata)) {
      expect(["string", "number", "boolean"]).toContain(typeof valeur);
    }
  });

  it("ne recopie jamais le texte cherché : la requête n'est pas une propriété", () => {
    const entree = entreeSuiviDepuisMesure({
      nom: "recherche_effectuee",
      parcoursId: "P-RECHERCHE",
      surface: "staff",
      route: "/hote/recherche",
      nombreResultats: 3,
    });
    expect(JSON.stringify(entree)).not.toContain("q=");
    expect(Object.keys(entree.metadata)).not.toContain("requete");
  });

  it("ramène les rôles hors mesure au rôle le plus proche", () => {
    expect(roleMesure("operateur")).toBe("hote");
    expect(roleMesure("comptable")).toBe("hote");
    expect(roleMesure("proprietaire")).toBe("proprietaire");
    expect(roleMesure("inconnu")).toBe("hote");
    expect(roleMesure(undefined)).toBe("hote");
  });

  it("borne le nombre de résultats", () => {
    expect(nombreResultatsBorne(4.7)).toBe(4);
    expect(nombreResultatsBorne(-3)).toBe(0);
    expect(nombreResultatsBorne(Number.NaN)).toBe(0);
    expect(nombreResultatsBorne(10 ** 9)).toBe(100000);
  });

  it("refuse un parcours ou une route non normalisée", () => {
    expect(() =>
      evenementDepuisMesure({
        nom: "etape_vue",
        parcoursId: "P-INCONNU",
        surface: "staff",
        route: "/hote",
      }),
    ).toThrow(/Parcours inconnu/);
    expect(() =>
      evenementDepuisMesure({
        nom: "etape_vue",
        parcoursId: "P-HOTE-5",
        surface: "staff",
        route: "",
      }),
    ).toThrow(/Route invalide/);
  });

  it("normalise la route d'un séjour sans exposer le token", () => {
    const entree = entreeSuiviDepuisMesure({
      nom: "parcours_demarre",
      parcoursId: "P-SEJOUR",
      surface: "voyageur",
      route: "/voyageur",
      role: "voyageur",
    });
    expect(entree.page).toBe("/voyageur");
    expect(JSON.stringify(entree)).not.toContain("t=");
  });
});
