import { describe, expect, it } from "vitest";
import { LANGUES_PUBLIQUES } from "@/domain/page-publique";
import { traductionsDemandes } from "@/lib/i18n-demandes";

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
      expect(t.okConvertie("DIR-123")).toContain("DIR-123");
    }
    expect(traductionsDemandes("de").convertir).toBe("Umwandeln");
  });

  it("replie sur le français pour une langue inconnue", () => {
    expect(traductionsDemandes("pt").titre).toBe("Demandes de séjour");
  });
});
