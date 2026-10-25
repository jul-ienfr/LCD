import { describe, expect, it } from "vitest";
import {
  COMMISSION_DEFAUT_BP,
  commissionBpValide,
  formaterCommissionBp,
  montantCommission,
  netProprietaire,
} from "@/domain/commission";

describe("commission de mandat", () => {
  it("calcule 20 % du CA et le net", () => {
    expect(montantCommission(80_000, 2_000)).toBe(16_000);
    expect(netProprietaire(80_000, 2_000)).toBe(64_000);
  });

  it("gère 0 % et 50 %", () => {
    expect(montantCommission(10_000, 0)).toBe(0);
    expect(montantCommission(10_000, 5_000)).toBe(5_000);
    expect(netProprietaire(10_000, 0)).toBe(10_000);
  });

  it("arrondit au centime", () => {
    expect(montantCommission(12_345, 1_550)).toBe(1_913);
  });

  it("refuse un taux hors bornes", () => {
    expect(commissionBpValide(COMMISSION_DEFAUT_BP)).toBe(true);
    expect(commissionBpValide(-1)).toBe(false);
    expect(commissionBpValide(5_001)).toBe(false);
    expect(() => montantCommission(10_000, 5_001)).toThrow();
  });

  it("formate le taux", () => {
    expect(formaterCommissionBp(2_000)).toContain("20");
  });
});
