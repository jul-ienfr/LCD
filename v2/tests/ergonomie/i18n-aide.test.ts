import { describe, expect, it } from "vitest";
import { LANGUES } from "@/lib/i18n";
import { AIDE, traductionsAide } from "@/lib/i18n/public/aide";

/** Chemins de toutes les feuilles : listes dépliées par index, objets par clé. */
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

describe("dictionnaire de l'aide", () => {
  it("couvre exactement les cinq langues", () => {
    expect(Object.keys(AIDE).sort()).toEqual([...LANGUES].sort());
  });

  it("présente les mêmes clés et la même forme dans les cinq langues", () => {
    const reference = forme(AIDE.fr);
    expect(reference.length).toBeGreaterThan(50);
    for (const langue of LANGUES) {
      expect(forme(AIDE[langue]), langue).toEqual(reference);
    }
  });

  it("n'a aucune valeur vide", () => {
    for (const langue of LANGUES) {
      const chaines = textes(AIDE[langue]);
      expect(chaines.length, langue).toBeGreaterThan(50);
      for (const { chemin, texte } of chaines) {
        expect(texte.trim(), `${langue}.${chemin}`).not.toBe("");
      }
    }
  });

  it("documente les 7 rôles et les 5 limites, traduits", () => {
    for (const langue of LANGUES) {
      expect(AIDE[langue].roles, langue).toHaveLength(7);
      expect(AIDE[langue].limites, langue).toHaveLength(5);
      expect(AIDE[langue].rolesEntetes, langue).toHaveLength(2);
      expect(AIDE[langue].espacesEntetes, langue).toHaveLength(3);
      expect(AIDE[langue].espaces, langue).toHaveLength(9);
    }
  });

  it("conserve les chemins techniques identiques d'une langue à l'autre", () => {
    const chemins = AIDE.fr.espaces.map((ligne) => ligne.chemin);
    for (const langue of LANGUES) {
      expect(AIDE[langue].espaces.map((ligne) => ligne.chemin), langue).toEqual(
        chemins,
      );
    }
    expect(chemins).toContain("/reserver");
    expect(chemins).toContain("/voyageur");
    expect(chemins).toContain("/presta");
    expect(chemins).toContain("/proprio");
  });

  it("garde le gabarit {nom} du titre SEO (remplacé par l'identité)", () => {
    for (const langue of LANGUES) {
      expect(AIDE[langue].metaTitre, langue).toContain("{nom}");
    }
  });

  it("replie sur le français pour une langue inconnue ou absente", () => {
    expect(traductionsAide("nl")).toBe(AIDE.fr);
    expect(traductionsAide("FR")).toBe(AIDE.fr);
    expect(traductionsAide(null)).toBe(AIDE.fr);
    expect(traductionsAide(undefined)).toBe(AIDE.fr);
    expect(traductionsAide(42)).toBe(AIDE.fr);
    expect(traductionsAide({})).toBe(AIDE.fr);
  });

  it("sert la langue demandée quand elle existe", () => {
    for (const langue of LANGUES) {
      expect(traductionsAide(langue)).toBe(AIDE[langue]);
    }
  });
});
