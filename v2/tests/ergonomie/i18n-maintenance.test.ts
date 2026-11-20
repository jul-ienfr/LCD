import { describe, expect, it } from "vitest";
import { LANGUES } from "@/lib/i18n";
import {
  MAINTENANCE,
  traductionsMaintenance,
} from "@/lib/i18n/public/maintenance";

/** Chemins de toutes les feuilles : objets par clé. */
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

describe("dictionnaire de la page de maintenance", () => {
  it("couvre exactement les cinq langues", () => {
    expect(Object.keys(MAINTENANCE).sort()).toEqual([...LANGUES].sort());
  });

  it("présente les mêmes clés et la même forme dans les cinq langues", () => {
    const reference = forme(MAINTENANCE.fr);
    for (const langue of LANGUES) {
      expect(forme(MAINTENANCE[langue]), langue).toEqual(reference);
    }
  });

  it("n'a aucune valeur vide", () => {
    for (const langue of LANGUES) {
      for (const [cle, valeur] of Object.entries(MAINTENANCE[langue])) {
        expect(String(valeur).trim().length, `${langue}.${cle}`).toBeGreaterThan(
          0,
        );
      }
    }
  });

  it("replie sur le français pour une langue inconnue", () => {
    expect(traductionsMaintenance("pt")).toEqual(MAINTENANCE.fr);
    expect(traductionsMaintenance("fr").titre).toContain("suspendu");
  });
});
