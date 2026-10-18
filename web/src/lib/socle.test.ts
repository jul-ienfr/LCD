import { describe, expect, it } from "vitest";
import { choisirLangue, LANGUES, LIBELLES_ACTION, t } from "./i18n";
import { t as tOperateur } from "@/plugins/dash-operateur/i18n";
import { t as tVoyageur } from "@/plugins/dash-voyageur/i18n";
import { t as tProprio } from "@/plugins/dash-proprio/i18n";
import { t as tCommercial } from "@/plugins/dash-commercial/i18n";
import { ACTIONS } from "./gateway";

// Garde-fous front (miroirs gateway, jamais de secret navigateur) :
// 5 langues complètes, 14 actions libellées, priorité ?lang= > cookie > AL.
describe("i18n 5 langues", () => {
  it("socle FR/EN/ES/IT/DE", () => {
    expect([...LANGUES]).toEqual(["fr", "en", "es", "it", "de"]);
  });
  it("aucune clé cœur manquante (pilotage/voyageur/proprio/commercial)", () => {
    for (const cle of ["pilotage", "voyageur", "proprio", "commercial"])
      for (const l of LANGUES) expect(t(cle, l)).not.toMatch(/^\[.+\]$/);
  });
  it("refonte 2026 : KPIs + parcours complets via dicts plugins préfixés", () => {
    // F2 : ces clés ont MIGRÉ vers les dicts plugins (i18n préfixée §F3) —
    // le cœur ne les porte plus, le wrapper plugin les sert avec repli cœur.
    const parDict: [typeof tOperateur, string[]][] = [
      [tOperateur, [
        "operateur.kpi_logements", "operateur.kpi_todos", "operateur.kpi_ecritures",
        "operateur.kpi_fanout", "operateur.kpi_journal", "operateur.kpi_occupation",
        "operateur.kpi_routage", "operateur.th_dossier", "operateur.th_statut",
        "operateur.th_echeance", "operateur.actions_1tap",
      ]],
      [tVoyageur, [
        "voyageur.voyageur_bienvenue", "voyageur.par_nuit", "voyageur.extras_titre",
        "voyageur.incident_titre",
      ]],
      [tProprio, [
        "proprio.releve_titre", "proprio.releve_brut", "proprio.releve_net",
        "proprio.releve_canaux",
      ]],
      [tCommercial, [
        "commercial.pipeline_titre", "commercial.prospect_titre", "commercial.simulateur_titre",
      ]],
    ];
    for (const [tt, cles] of parDict)
      for (const cle of cles)
        for (const l of LANGUES) expect(tt(cle, l), `${cle}/${l}`).not.toMatch(/^\[.+\]$/);
  });
  it("repli cœur : le wrapper plugin sert les clés partagées (envoyer)", () => {
    for (const l of LANGUES) expect(tOperateur("envoyer", l)).toBe(t("envoyer", l));
  });
  it("clé inconnue = [clé] visible (jamais de silence)", () => {
    expect(t("cle_xyz_absente", "fr")).toBe("[cle_xyz_absente]");
    expect(tOperateur("operateur.cle_xyz_absente", "fr")).toBe("[operateur.cle_xyz_absente]");
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
