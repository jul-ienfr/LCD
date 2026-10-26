import { describe, expect, it } from "vitest";
import {
  CLES_COMPTES,
  comparerComptes,
  normaliserComptes,
} from "../../scripts/backup-manifest.mjs";

const ligne = "1,196,1260,722,165,147,70,53,56";

describe("manifeste de sauvegarde", () => {
  it("convertit la ligne psql en comptes typés", () => {
    const comptes = normaliserComptes(ligne);
    expect(Object.keys(comptes)).toEqual(CLES_COMPTES);
    expect(comptes.tenants).toBe(1);
    expect(comptes.migrations).toBe(56);
  });

  it("ne signale aucun écart quand tout correspond", () => {
    expect(comparerComptes(normaliserComptes(ligne), normaliserComptes(ligne)))
      .toEqual([]);
  });

  it("signale chaque table ou compteur divergent", () => {
    const ecarts = comparerComptes(
      normaliserComptes(ligne),
      normaliserComptes("1,196,1259,722,165,147,70,53,55"),
    );
    expect(ecarts).toEqual([
      "logements: attendu 1260, obtenu 1259",
      "migrations: attendu 56, obtenu 55",
    ]);
  });

  it("traite une ligne manquante comme vide", () => {
    expect(normaliserComptes(undefined).tenants).toBe(0);
    expect(comparerComptes(normaliserComptes(ligne), {})).toHaveLength(
      CLES_COMPTES.length,
    );
  });
});
