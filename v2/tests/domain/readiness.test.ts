import { describe, expect, it } from "vitest";
import { manquantsSchema } from "@/domain/readiness";

const complet = {
  cautions: "cautions",
  webhooks: "webhooks",
  webhookDeliveries: "webhook_deliveries",
  commissionBp: true,
  tenantNature: true,
  mandatMode: true,
};

describe("readiness schéma", () => {
  it("ne signale rien quand les migrations 0026-0030 sont présentes", () => {
    expect(manquantsSchema(complet)).toEqual([]);
  });

  it("signale toutes les migrations manquantes", () => {
    expect(manquantsSchema(undefined)).toEqual([
      "cautions",
      "webhooks",
      "webhook_deliveries",
      "logement_proprietaires.commission_bp",
      "tenants.nature",
      "logement_proprietaires.mode",
    ]);
  });

  it("signale uniquement la colonne commission manquante", () => {
    expect(manquantsSchema({ ...complet, commissionBp: false })).toEqual([
      "logement_proprietaires.commission_bp",
    ]);
  });

  it("signale les migrations non appliquées", () => {
    expect(manquantsSchema({ ...complet, migrations: 54 }, 55)).toEqual([
      "migrations.55",
    ]);
    expect(manquantsSchema({ ...complet, migrations: 55 }, 55)).toEqual([]);
    expect(manquantsSchema(complet, 55)).toEqual(["migrations.55"]);
    expect(manquantsSchema({ ...complet, migrations: 55 }, 0)).toEqual([]);
  });
});
