import { describe, expect, it } from "vitest";
import {
  fusionnerRestrictionsPlan,
  fusionnerTarifsPlan,
  prixPlanDerive,
} from "@/domain/plan-tarifaire";
import type { RestrictionSejour } from "@/domain/restriction-sejour";

function restriction(
  date: string,
  valeurs: Partial<RestrictionSejour> = {},
): RestrictionSejour {
  return {
    id: `r-${date}`,
    tenantId: "t",
    logementId: "l",
    date,
    sejourMin: null,
    sejourMax: null,
    arriveeAutorisee: null,
    departAutorisee: null,
    stopSell: null,
    updatedAt: new Date("2027-01-01"),
    ...valeurs,
  };
}

describe("plans tarifaires", () => {
  it("calcule un prix dérivé arrondi et jamais nul", () => {
    expect(prixPlanDerive(10000, -10)).toBe(9000);
    expect(prixPlanDerive(9999, 12)).toBe(11199);
    expect(prixPlanDerive(1, -90)).toBe(1);
  });

  it("fusionne les tarifs selon le mode du plan", () => {
    const base = [
      { date: "2027-01-01", prixCentimes: 10000 },
      { date: "2027-01-02", prixCentimes: 12000 },
    ];
    const plan = [{ date: "2027-01-02", prixCentimes: 15000 }];
    expect(fusionnerTarifsPlan(base, plan, "independant", -10)).toEqual([
      { date: "2027-01-02", prixCentimes: 15000 },
    ]);
    expect(fusionnerTarifsPlan(base, plan, "derive", -10)).toEqual([
      { date: "2027-01-01", prixCentimes: 9000 },
      { date: "2027-01-02", prixCentimes: 15000 },
    ]);
  });

  it("hérite des règles de base et laisse le plan primer champ par champ", () => {
    const base = [
      restriction("2027-01-01", { sejourMin: 2, stopSell: true }),
      restriction("2027-01-02", { sejourMax: 7 }),
    ];
    const plan = [
      restriction("2027-01-01", {
        sejourMin: 3,
        stopSell: false,
        planTarifaireId: "p",
      }),
    ];
    const fusion = fusionnerRestrictionsPlan(base, plan, true);
    expect(fusion).toHaveLength(2);
    expect(fusion[0]).toMatchObject({
      date: "2027-01-01",
      sejourMin: 3,
      stopSell: false,
    });
    expect(fusion[1]).toMatchObject({ date: "2027-01-02", sejourMax: 7 });
    expect(fusionnerRestrictionsPlan(base, plan, false)).toEqual(plan);
  });
});
