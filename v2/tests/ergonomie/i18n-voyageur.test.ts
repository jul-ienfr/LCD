import { describe, expect, it } from "vitest";
import { LANGUES } from "@/lib/i18n";
import {
  traductionsVoyageur,
  type TraductionsVoyageur,
} from "@/lib/i18n/public/voyageur";

const REFERENCE: TraductionsVoyageur = traductionsVoyageur("fr");

describe("dictionnaire voyageur (T047-T056)", () => {
  it("fournit toutes les clés dans les cinq langues, sans valeur vide", () => {
    const cles = Object.keys(REFERENCE).sort();
    expect(cles.length).toBeGreaterThan(40);
    for (const langue of LANGUES) {
      const traductions = traductionsVoyageur(langue);
      expect(Object.keys(traductions).sort(), langue).toEqual(cles);
      for (const [cle, valeur] of Object.entries(traductions)) {
        expect(typeof valeur, `${langue}.${cle}`).toBe("string");
        expect(valeur.trim(), `${langue}.${cle}`).not.toBe("");
      }
    }
  });

  it("replie sur le français pour une langue inconnue", () => {
    for (const inconnue of ["nl", "pt-BR", "", null, undefined]) {
      expect(traductionsVoyageur(inconnue).titre).toBe(REFERENCE.titre);
      expect(traductionsVoyageur(inconnue).sommaire).toBe(REFERENCE.sommaire);
    }
  });

  it("porte les libellés des cinq cartes d'action et de la barre mobile", () => {
    for (const langue of LANGUES) {
      const t = traductionsVoyageur(langue);
      const essentiels = [
        t.actionIncidentTitre,
        t.actionIncidentLien,
        t.actionExtraTitre,
        t.actionExtraLien,
        t.actionDepartTitre,
        t.actionDepartLien,
        t.actionAvisTitre,
        t.actionAvisLien,
        t.appeler,
        t.ecrire,
        t.guide,
        t.derniereMiseAJour,
        t.horsLigneTitre,
        t.adresse,
        t.itineraire,
        t.reseauWifi,
        t.motDePasseWifi,
        t.urgence,
        t.arrivee,
        t.depart,
        t.nuits,
      ];
      for (const libelle of essentiels) {
        expect(libelle.trim(), langue).not.toBe("");
      }
    }
  });

  it("distingue le titre du séjour des autres libellés (un seul h1)", () => {
    for (const langue of LANGUES) {
      const t = traductionsVoyageur(langue);
      expect(t.titre.trim()).not.toBe("");
      expect(t.titre).not.toBe(t.sommaire);
    }
  });
});
