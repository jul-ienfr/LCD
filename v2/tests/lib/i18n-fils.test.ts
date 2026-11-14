import { describe, expect, it } from "vitest";
import { LANGUES_PUBLIQUES } from "@/domain/page-publique";
import { messageFils, traductionsFils } from "@/lib/i18n-fils";

describe("i18n des fils voyageurs", () => {
  it("traduit l'inbox dans toutes les langues publiques", () => {
    for (const langue of LANGUES_PUBLIQUES) {
      const t = traductionsFils(langue);
      expect(t.titre.length).toBeGreaterThan(3);
      expect(t.repondre.length).toBeGreaterThan(3);
      expect(Object.keys(t.statuts).sort()).toEqual(["clos", "en_attente", "ouvert"]);
      expect(t.colonneVoyageur.length).toBeGreaterThan(3);
      expect(t.variables).toContain("{{voyageur}}");
    }
  });

  it("change bien de langue et retombe sur le français", () => {
    expect(traductionsFils("en").titre).not.toBe(traductionsFils("fr").titre);
    expect(traductionsFils("es").repondre).toBe("Responder");
    expect(traductionsFils("xx").titre).toBe(traductionsFils("fr").titre);
  });

  it("résout les messages de confirmation et retombe sur l'erreur", () => {
    const t = traductionsFils("fr");
    expect(messageFils(t, "messageEnvoye")).toBe(t.messageEnvoye);
    expect(messageFils(t, "okCree")).toBe(t.okCree);
    expect(messageFils(t, "inconnu")).toBe(t.erreur);
  });
});
