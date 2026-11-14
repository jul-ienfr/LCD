import { expect, describe, it } from "vitest";
import {
  bornerCa,
  bornerLogements,
  euros,
  simulerOffre,
} from "@/domain/offres";

describe("offres LCD", () => {
  it("applique le plancher FULL sous 596 € de CA mensuel", () => {
    expect(simulerOffre("FULL", { logements: 1, caMensuelCentimes: 200_000 })).toMatchObject({
      mensuelCentimes: 50_000,
      annuelCentimes: 600_000,
    });
    expect(simulerOffre("FULL", { logements: 1, caMensuelCentimes: 50_000 })).toMatchObject({
      mensuelCentimes: 14_900,
      annuelCentimes: 178_800,
    });
  });

  it("facture PILOTAGE par logement", () => {
    expect(simulerOffre("PILOTAGE", { logements: 3, caMensuelCentimes: 0 })).toEqual({
      code: "PILOTAGE",
      mensuelCentimes: 44_700,
      annuelCentimes: 536_400,
      note: "3 logement(s) × 149 €/mois.",
    });
  });

  it("présente le KIT en récurrent annuel", () => {
    expect(simulerOffre("KIT", { logements: 1, caMensuelCentimes: 0 })).toMatchObject({
      mensuelCentimes: 2_000,
      annuelCentimes: 24_000,
    });
  });

  it("borne les entrées du calculateur", () => {
    expect(bornerLogements(0)).toBe(1);
    expect(bornerLogements(999)).toBe(50);
    expect(bornerLogements(Number.NaN)).toBe(1);
    expect(bornerCa(-10)).toBe(0);
    expect(bornerCa(999_999_999)).toBe(100_000_000);
  });

  it("formate les euros sans décimales inutiles", () => {
    expect(euros(14_900)).toContain("149");
    expect(euros(50_050)).toContain("500,50");
  });
});
