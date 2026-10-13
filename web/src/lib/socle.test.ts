import { describe, expect, it } from "vitest";
import { choisirLangue, LANGUES, LIBELLES_ACTION, t } from "./i18n";
import { ACTIONS } from "./gateway";

// Garde-fous front (miroirs gateway, jamais de secret navigateur) :
// 5 langues complètes, 14 actions libellées, priorité ?lang= > cookie > AL.
describe("i18n 5 langues", () => {
  it("socle FR/EN/ES/IT/DE", () => {
    expect([...LANGUES]).toEqual(["fr", "en", "es", "it", "de"]);
  });
  it("aucune clé manquante (titre/pilotage/voyageur/proprio/commercial)", () => {
    for (const cle of ["titre", "pilotage", "voyageur", "proprio", "commercial"])
      for (const l of LANGUES) expect(t(cle, l)).not.toMatch(/^\[.+\]$/);
  });
  it("clé inconnue = [clé] visible (jamais de silence)", () => {
    expect(t("cle_xyz_absente", "fr")).toBe("[cle_xyz_absente]");
  });
  it("priorité ?lang= > cookie > Accept-Language > fr", () => {
    expect(choisirLangue("de", "en", "es-ES")).toBe("de");
    expect(choisirLangue("", "it", "es-ES")).toBe("it");
    expect(choisirLangue("", "", "es-ES,es;q=0.9")).toBe("es");
    expect(choisirLangue("", "", "")).toBe("fr");
  });
});

describe("actions 1-tap (miroir gateway CIBLES)", () => {
  it("14 actions, libellées en 5 langues", () => {
    expect(ACTIONS).toHaveLength(14);
    for (const a of ACTIONS)
      for (const l of LANGUES)
        expect(LIBELLES_ACTION[a.id]?.[l]).toBeTruthy();
  });
});
