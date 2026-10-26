import { describe, expect, it } from "vitest";
import {
  confirmationPurgeValide,
  dateLimiteRetention,
  depuisJours,
  familleAuditValide,
  JOURS_AUDIT,
  joursAuditValide,
  joursRetentionValide,
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

  it("encadre la rétention et la confirmation de purge", () => {
    expect(joursRetentionValide(365)).toBe(true);
    expect(joursRetentionValide(1825)).toBe(true);
    expect(joursRetentionValide(364)).toBe(false);
    expect(joursRetentionValide(365.5)).toBe(false);
    expect(joursRetentionValide(36_501)).toBe(false);
    expect(confirmationPurgeValide("PURGER")).toBe(true);
    expect(confirmationPurgeValide("  PURGER ")).toBe(true);
    expect(confirmationPurgeValide("purger")).toBe(false);
    expect(confirmationPurgeValide("")).toBe(false);

    const maintenant = new Date("2026-10-25T12:00:00.000Z");
    expect(dateLimiteRetention(365, maintenant).toISOString()).toBe(
      "2025-10-25T12:00:00.000Z",
    );
  });
});
