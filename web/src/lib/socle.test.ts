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
  it("refonte 2026 : KPIs + parcours complets en 5 langues", () => {
    for (const cle of [
      "kpi_logements", "kpi_todos", "kpi_ecritures", "kpi_fanout",
      "kpi_journal", "kpi_occupation", "kpi_routage",
      "voyageur_bienvenue", "par_nuit", "extras_titre", "incident_titre",
      "releve_titre", "releve_brut", "releve_net", "releve_canaux",
      "pipeline_titre", "prospect_titre", "simulateur_titre",
      "th_dossier", "th_statut", "th_echeance", "actions_1tap",
    ])
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
