import { describe, expect, it } from "vitest";
import { LANGUES_PUBLIQUES } from "@/domain/page-publique";
import { traductionsDemandes } from "@/lib/i18n-demandes";

/**
 * Un objet de traductions est renvoyé tel quel par le `load` de
 * `/hote/demandes` : il doit donc être sérialisable (SvelteKit « devalue »).
 * Une entrée fonction y a provoqué un 500 `load_not_serializable` sur toute la
 * page, invisible tant que la route n'était pas visitée : mesuré le
 * 2026-11-13 par `npm run audit:ergonomie` sur les routes staff.
 */
function valeursNonSerialisables(valeur: unknown, chemin = ""): string[] {
  if (typeof valeur === "function") return [chemin || "(racine)"];
  if (valeur === null || typeof valeur !== "object") return [];
  return Object.entries(valeur as Record<string, unknown>).flatMap(([cle, suite]) =>
    valeursNonSerialisables(suite, chemin ? `${chemin}.${cle}` : cle),
  );
}

describe("i18n demandes de séjour", () => {
  it("fournit les six langues et les quatre statuts", () => {
    for (const langue of LANGUES_PUBLIQUES) {
      const t = traductionsDemandes(langue);
      expect(t.titre.length).toBeGreaterThan(0);
      expect(Object.keys(t.statuts).sort()).toEqual([
        "convertie",
        "nouvelle",
        "qualifiee",
        "refusee",
      ]);
    }
    expect(traductionsDemandes("de").convertir).toBe("Umwandeln");
  });

  it("garde la référence dans le message de conversion", () => {
    for (const langue of LANGUES_PUBLIQUES) {
      const message = traductionsDemandes(langue).okConvertie.replace(
        "{reference}",
        "DIR-123",
      );
      expect(message).toContain("DIR-123");
      expect(message).not.toContain("{reference}");
    }
  });

  it("n'expose que des valeurs sérialisables", () => {
    for (const langue of LANGUES_PUBLIQUES) {
      expect(valeursNonSerialisables(traductionsDemandes(langue))).toEqual([]);
    }
  });

  it("replie sur le français pour une langue inconnue", () => {
    expect(traductionsDemandes("pt").titre).toBe("Demandes de séjour");
  });
});
