import { describe, expect, it } from "vitest";
import { offreValide, TRANSITIONS_OFFRE } from "@/domain/offre";

describe("offre", () => {
  it("valide une offre correcte", () => {
    expect(
      offreValide({ titre: "Forfait FULL", montantCentimes: 14900 }),
    ).toBe(true);
  });

  it("refuse un montant négatif", () => {
    expect(
      offreValide({ titre: "Forfait", montantCentimes: -1 }),
    ).toBe(false);
  });

  it("définit les transitions d'offre", () => {
    expect(TRANSITIONS_OFFRE.brouillon).toContain("envoyee");
    expect(TRANSITIONS_OFFRE.acceptee).toHaveLength(0);
  });
});
