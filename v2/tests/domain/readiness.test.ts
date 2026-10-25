import { describe, expect, it } from "vitest";
import { manquantsSchema } from "@/domain/readiness";

const complet = {
  cautions: "cautions",
  webhooks: "webhooks",
  webhookDeliveries: "webhook_deliveries",
  commissionBp: true,
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
    ]);
  });

  it("signale uniquement la colonne commission manquante", () => {
    expect(manquantsSchema({ ...complet, commissionBp: false })).toEqual([
      "logement_proprietaires.commission_bp",
    ]);
  });
});
