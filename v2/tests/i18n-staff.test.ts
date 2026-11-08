import { describe, expect, it } from "vitest";
import {
  LANGUES_STAFF,
  resoudreLangue,
  traductionsConnexion,
} from "@/lib/i18n-staff";
import { traductionsTableauBord } from "@/lib/i18n-dashboard";
import { traductionsNavigation } from "@/lib/i18n-nav";
import { traductionsAudit } from "@/lib/i18n-audit";
import { traductionsLogements } from "@/lib/i18n-logements";

describe("i18n staff — connexion", () => {
  it("fournit les cinq langues sans repli silencieux", () => {
    for (const langue of LANGUES_STAFF) {
      const t = traductionsConnexion(langue);
      expect(t.seConnecter.length).toBeGreaterThan(3);
      expect(t.erreurAcces.length).toBeGreaterThan(10);
    }
  });

  it("résout la langue du cookie ou de l’URL", () => {
    expect(resoudreLangue("de")).toBe("de");
    expect(resoudreLangue("xx")).toBe("fr");
    expect(resoudreLangue(null)).toBe("fr");
  });

  it("retombe en français pour une langue inconnue", () => {
    expect(traductionsConnexion("xx").bonRetour).toBe("Bon retour.");
  });

  it("traduit le tableau de bord dans les cinq langues", () => {
    for (const langue of LANGUES_STAFF) {
      expect(traductionsTableauBord(langue).logements.length).toBeGreaterThan(3);
      expect(traductionsTableauBord(langue).ca.length).toBeGreaterThan(3);
    }
    expect(traductionsTableauBord("xx").bonjour).toBe("Bonjour");
  });

  it("traduit la navigation staff dans les cinq langues", () => {
    for (const langue of LANGUES_STAFF) {
      expect(traductionsNavigation(langue).exploitation.length).toBeGreaterThan(3);
      expect(traductionsNavigation(langue).quitter.length).toBeGreaterThan(2);
      expect((traductionsNavigation(langue).roles.admin ?? "").length).toBeGreaterThan(3);
    }
    expect(traductionsNavigation("xx").voirSite).toBe("Voir le site");
  });

  it("traduit le journal d’audit", () => {
    for (const langue of LANGUES_STAFF) {
      expect(traductionsAudit(langue).filtrer.length).toBeGreaterThan(3);
      expect(traductionsAudit(langue).purger.length).toBeGreaterThan(4);
    }
    expect(traductionsAudit("xx").tableau).toBe("Tableau de bord");
  });

  it("traduit la page logements", () => {
    for (const langue of LANGUES_STAFF) {
      const t = traductionsLogements(langue);
      expect(t.titre.length).toBeGreaterThan(3);
      expect(t.cree("log-1")).toContain("log-1");
    }
    expect(traductionsLogements("xx").titre).toBe("Logements");
  });
});
