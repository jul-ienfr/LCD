import { describe, expect, it } from "vitest";
import { libelleActionAudit } from "@/domain/audit";

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
});
