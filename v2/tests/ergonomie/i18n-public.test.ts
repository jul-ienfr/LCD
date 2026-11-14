import { describe, expect, it } from "vitest";
import { LANGUES } from "@/lib/i18n";
import { traductionsPubliques } from "@/lib/i18n-public";

describe("dictionnaire public", () => {
  it("fournit toutes les clés dans les cinq langues", () => {
    const reference = Object.keys(traductionsPubliques("fr")).sort();
    for (const langue of LANGUES) {
      const traductions = traductionsPubliques(langue);
      expect(Object.keys(traductions).sort(), langue).toEqual(reference);
      for (const [cle, valeur] of Object.entries(traductions)) {
        expect(valeur, `${langue}.${cle}`).toBeTruthy();
      }
    }
  });

  it("replie sur le français pour une langue inconnue", () => {
    expect(traductionsPubliques("nl").allerAuContenu).toBe("Aller au contenu");
    expect(traductionsPubliques(null).allerAuContenu).toBe("Aller au contenu");
  });
});
