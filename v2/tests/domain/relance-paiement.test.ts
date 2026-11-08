import { describe, expect, it } from "vitest";
import {
  ajouterJours,
  echeancesARelancer,
  type LigneRelance,
} from "@/domain/relance-paiement";

function ligne(partiel: Partial<LigneRelance> = {}): LigneRelance {
  return {
    echeanceId: "e1",
    reservationId: "r1",
    ref: "DIR-1",
    clientNom: "Camille",
    email: "camille@example.test",
    type: "acompte",
    montantCentimes: 30_000,
    exigibleLe: "2026-11-20",
    ...partiel,
  };
}

describe("relances de paiement", () => {
  it("calcule une limite à J+30", () => {
    expect(ajouterJours("2026-11-06", 30)).toBe("2026-12-06");
    expect(ajouterJours("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("inclut les échéances dues et proches, triées par date", () => {
    const relances = echeancesARelancer(
      [
        ligne({ echeanceId: "e3", exigibleLe: "2026-12-07" }),
        ligne({ echeanceId: "e2", exigibleLe: "2026-12-06" }),
        ligne({ echeanceId: "e1", exigibleLe: "2026-11-01" }),
      ],
      { tenantId: "t1", aujourdhui: "2026-11-06" },
    );

    expect(relances.map((r) => r.echeanceId)).toEqual(["e1", "e2"]);
    expect(relances[0]?.enRetard).toBe(true);
    expect(relances[0]?.joursRestants).toBe(-5);
    expect(relances[1]?.joursRestants).toBe(30);
  });

  it("respecte une fenêtre personnalisée", () => {
    const relances = echeancesARelancer(
      [ligne({ exigibleLe: "2026-11-09" })],
      { tenantId: "t1", aujourdhui: "2026-11-06", fenetreJours: 2 },
    );
    expect(relances).toHaveLength(0);
  });
});
