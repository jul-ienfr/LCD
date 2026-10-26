import { describe, expect, it } from "vitest";
import {
  depuisJours,
  familleAuditValide,
  JOURS_AUDIT,
  joursAuditValide,
  libelleActionAudit,
} from "@/domain/audit";

describe("journal d’audit", () => {
  it("traduit les actions connues", () => {
    expect(libelleActionAudit("logement.creer")).toBe("Logement créé");
    expect(libelleActionAudit("utilisateur.desactiver")).toBe(
      "Utilisateur désactivé",
    );
    expect(libelleActionAudit("facture.statut")).toBe(
      "Statut de facture modifié",
    );
  });

  it("conserve le code brut pour une action inconnue", () => {
    expect(libelleActionAudit("action.future")).toBe("action.future");
  });

  it("valide les périodes et calcule la borne", () => {
    expect(joursAuditValide(7)).toBe(true);
    expect(joursAuditValide(30)).toBe(true);
    expect(joursAuditValide(90)).toBe(true);
    expect(joursAuditValide(0)).toBe(false);
    expect(joursAuditValide(365)).toBe(false);

    const maintenant = new Date("2026-10-25T12:00:00.000Z");
    expect(depuisJours(7, maintenant).toISOString()).toBe(
      "2026-10-18T12:00:00.000Z",
    );
    expect(JOURS_AUDIT).toHaveLength(3);
  });

  it("valide les familles d’action", () => {
    expect(familleAuditValide("menage")).toBe(true);
    expect(familleAuditValide("assistant")).toBe(true);
    expect(familleAuditValide("inconnue")).toBe(false);
    expect(familleAuditValide("")).toBe(false);
  });
});
