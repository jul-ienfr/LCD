import { describe, expect, it } from "vitest";
import { LANGUES } from "@/lib/i18n";
import { traductionsVitrine, VITRINE } from "@/lib/i18n/public/vitrine";

/**
 * Chemins de toutes les feuilles d'une traduction : les listes sont dépliées
 * par index, les objets par clé. Deux langues sont complètes quand leurs
 * formes sont identiques.
 */
function forme(valeur: unknown, prefixe = ""): string[] {
  if (Array.isArray(valeur)) {
    return valeur.flatMap((item, index) => forme(item, `${prefixe}[${index}]`));
  }
  if (valeur !== null && typeof valeur === "object") {
    return Object.entries(valeur as Record<string, unknown>).flatMap(
      ([cle, item]) => forme(item, prefixe ? `${prefixe}.${cle}` : cle),
    );
  }
  return [prefixe];
}

/** Toutes les chaînes d'une traduction, avec leur chemin. */
function textes(
  valeur: unknown,
  prefixe = "",
): { chemin: string; texte: string }[] {
  if (typeof valeur === "string") return [{ chemin: prefixe, texte: valeur }];
  if (Array.isArray(valeur)) {
    return valeur.flatMap((item, index) =>
      textes(item, `${prefixe}[${index}]`),
    );
  }
  if (valeur !== null && typeof valeur === "object") {
    return Object.entries(valeur as Record<string, unknown>).flatMap(
      ([cle, item]) => textes(item, prefixe ? `${prefixe}.${cle}` : cle),
    );
  }
  return [];
}

describe("dictionnaire de la vitrine", () => {
  it("couvre exactement les cinq langues", () => {
    expect(Object.keys(VITRINE).sort()).toEqual([...LANGUES].sort());
  });

  it("présente les mêmes clés et la même forme dans les cinq langues", () => {
    const reference = forme(VITRINE.fr);
    expect(reference.length).toBeGreaterThan(50);
    for (const langue of LANGUES) {
      expect(forme(VITRINE[langue]), langue).toEqual(reference);
    }
  });

  it("n'a aucune valeur vide", () => {
    for (const langue of LANGUES) {
      const chaines = textes(VITRINE[langue]);
      expect(chaines.length, langue).toBeGreaterThan(50);
      for (const { chemin, texte } of chaines) {
        expect(texte.trim(), `${langue}.${chemin}`).not.toBe("");
      }
    }
  });

  it("garde le gabarit {nom} du titre SEO (remplacé par l'identité)", () => {
    for (const langue of LANGUES) {
      expect(VITRINE[langue].metaTitre, langue).toContain("{nom}");
    }
  });

  it("traduit réellement (aucune langue identique au français)", () => {
    for (const langue of LANGUES.filter((code) => code !== "fr")) {
      expect(VITRINE[langue].heroTitre, langue).not.toBe(VITRINE.fr.heroTitre);
    }
  });

  it("replie sur le français pour une langue inconnue ou absente", () => {
    expect(traductionsVitrine("nl")).toBe(VITRINE.fr);
    expect(traductionsVitrine("FR")).toBe(VITRINE.fr);
    expect(traductionsVitrine(null)).toBe(VITRINE.fr);
    expect(traductionsVitrine(undefined)).toBe(VITRINE.fr);
    expect(traductionsVitrine(42)).toBe(VITRINE.fr);
    expect(traductionsVitrine({})).toBe(VITRINE.fr);
  });

  it("sert la langue demandée quand elle existe", () => {
    for (const langue of LANGUES) {
      expect(traductionsVitrine(langue)).toBe(VITRINE[langue]);
    }
  });
});
