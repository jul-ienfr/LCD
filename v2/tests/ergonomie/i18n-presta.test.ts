import { describe, expect, it } from "vitest";
import { LANGUES } from "@/lib/i18n";
import {
  CODES_ERREUR_PRESTA,
  CODES_RETOUR_PRESTA,
  traductionsPresta,
  type TraductionsPresta,
} from "@/lib/i18n-presta";

const REFERENCE: TraductionsPresta = traductionsPresta("fr");

/**
 * Libellés composés : ce sont des fonctions (masquées par `masquerFonctions`,
 * donc invisibles dans `Object.keys`). Chacune est appelée ici explicitement
 * avec des arguments représentatifs ; un libellé composé ajouté au dictionnaire
 * sans argument d'essai fait échouer le test.
 */
const ARGUMENTS: Record<string, string[]> = {
  resume: ["3"],
  offresTitre: ["2"],
  dureePrevue: ["1 h 30"],
  prevu: ["1 h 30"],
  recuLe: ["23/11/2026 08:12"],
  preuveSoumiseLe: ["23/11/2026 08:12"],
  preuveValideeLe: ["23/11/2026 08:12", "equipe@lcd.test"],
  refusACorriger: ["photo illisible"],
  terrainFileEnAttente: ["2"],
  terrainSynchronise: ["2"],
};

/** Toutes les clés propres, fonctions comprises (`Object.keys` les cache). */
const CLES = Object.getOwnPropertyNames(REFERENCE).sort();

function valeurNonVide(valeur: unknown, contexte: string): void {
  expect(typeof valeur, contexte).toBe("string");
  expect((valeur as string).trim(), contexte).not.toBe("");
}

describe("dictionnaire de l'espace prestataire (FR-038)", () => {
  it("déclare chaque clé dans les cinq langues, sans valeur vide", () => {
    expect(CLES.length).toBeGreaterThan(40);
    for (const langue of LANGUES) {
      const traductions = traductionsPresta(langue) as unknown as Record<string, unknown>;
      expect(Object.getOwnPropertyNames(traductions).sort(), langue).toEqual(CLES);
      for (const cle of CLES) {
        const valeur = traductions[cle];
        const contexte = `${langue}.${cle}`;
        if (typeof valeur === "function") {
          const args = ARGUMENTS[cle];
          expect(args, `arguments d'essai manquants pour ${contexte}`).toBeDefined();
          valeurNonVide((valeur as (...a: string[]) => string)(...(args as string[])), contexte);
        } else if (typeof valeur === "object" && valeur !== null) {
          const reference = (REFERENCE as unknown as Record<string, unknown>)[cle] as Record<
            string,
            string
          >;
          expect(Object.keys(valeur).sort(), contexte).toEqual(
            Object.keys(reference).sort(),
          );
          for (const [sousCle, texte] of Object.entries(valeur as Record<string, string>)) {
            valeurNonVide(texte, `${contexte}.${sousCle}`);
          }
        } else {
          valeurNonVide(valeur, contexte);
        }
      }
    }
  });

  it("masque les libellés composés pour rester sérialisable", () => {
    // Le layout et la page importent le dictionnaire directement ; cette
    // propriété garantit qu'aucun dictionnaire de ce type ne peut casser un
    // `load` en y transmettant une fonction.
    const enumerables = Object.keys(REFERENCE);
    for (const cle of Object.keys(ARGUMENTS)) {
      expect(enumerables, cle).not.toContain(cle);
    }
  });

  it("compose les libellés avec les valeurs reçues", () => {
    for (const langue of LANGUES) {
      const t = traductionsPresta(langue);
      expect(t.resume(1)).not.toBe(t.resume(4));
      expect(t.offresTitre(2)).toContain("2");
      expect(t.dureePrevue("1 h 30")).toContain("1 h 30");
      expect(t.prevu("1 h 30")).toContain("1 h 30");
      expect(t.recuLe("23/11/2026 08:12")).toContain("23/11/2026 08:12");
      expect(t.preuveValideeLe("23/11/2026 08:12", "equipe@lcd.test")).toContain(
        "equipe@lcd.test",
      );
      expect(t.refusACorriger("photo illisible")).toContain("photo illisible");
    }
  });

  it("couvre exactement les codes de retour et d'échec de la route", () => {
    for (const langue of LANGUES) {
      const t = traductionsPresta(langue);
      expect(Object.keys(t.retours).sort(), langue).toEqual(
        [...CODES_RETOUR_PRESTA].sort(),
      );
      expect(Object.keys(t.erreurs).sort(), langue).toEqual(
        [...CODES_ERREUR_PRESTA].sort(),
      );
      for (const code of CODES_RETOUR_PRESTA) {
        valeurNonVide(t.retours[code], `${langue}.retours.${code}`);
      }
      for (const code of CODES_ERREUR_PRESTA) {
        valeurNonVide(t.erreurs[code], `${langue}.erreurs.${code}`);
      }
    }
  });

  it("distingue un succès d'un échec et ne renvoie jamais un texte identique", () => {
    for (const langue of LANGUES) {
      const t = traductionsPresta(langue);
      expect(t.retours.pointage_debut).not.toBe(t.retours.pointage_fin);
      expect(t.retours.dispatch_accepte).not.toBe(t.retours.dispatch_refuse);
      expect(t.erreurs.droits).not.toBe(t.erreurs.inattendu);
      // Le repli générique ne doit pas être l'un des messages spécifiques.
      expect(Object.values(t.retours)).not.toContain(t.retourEnregistre);
    }
  });

  it("traduit réellement : aucune langue ne recopie le français", () => {
    const fr = traductionsPresta("fr");
    for (const langue of ["en", "es", "it", "de"] as const) {
      const t = traductionsPresta(langue);
      expect(t.espace, langue).not.toBe(fr.espace);
      expect(t.mesMissions, langue).not.toBe(fr.mesMissions);
      expect(t.pointerDebut, langue).not.toBe(fr.pointerDebut);
    }
  });

  it("replie sur le français pour une langue inconnue", () => {
    for (const inconnue of ["nl", "pt-BR", "FR", "", null, undefined]) {
      expect(traductionsPresta(inconnue).espace).toBe(REFERENCE.espace);
      expect(traductionsPresta(inconnue).erreurs.droits).toBe(REFERENCE.erreurs.droits);
    }
  });
});
