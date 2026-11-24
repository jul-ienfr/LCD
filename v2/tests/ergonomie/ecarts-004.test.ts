import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Traçabilité des écarts 004 (spec 006, FR-047).
 *
 * Chaque écart de `specs/004-.../resultats.md` § 4 doit être soldé ou
 * explicitement accepté. Ce test verrouille la présence de chaque référence
 * et l'existence d'une décision, pour qu'aucun écart ne disparaisse du suivi.
 */

const lire = (...morceaux: string[]): string =>
  readFileSync(join(process.cwd(), "..", ...morceaux), "utf8");

const ECARTS = lire("specs", "006-autonomie-et-finitions", "ecarts-004.md");
const A_TRANCHER = lire("docs", "registres", "a-trancher.md");

const REFERENCES = [
  "T075",
  "LCP",
  "T007",
  "T008",
  "T011",
  "T045",
  "T057",
  "T071",
  "T076",
  "T077",
  "T078",
  "T072",
  "T103",
  "T107",
  "T110",
  "SC-001",
  "SC-003",
  "SC-010",
  "T083",
  "Taxe de séjour",
  "axe",
];

describe("écarts 004 tracés (FR-047)", () => {
  it("reprend chaque écart de resultats.md § 4", () => {
    for (const reference of REFERENCES) {
      expect(ECARTS, reference).toContain(reference);
    }
  });

  it("donne une décision explicite pour chaque ligne", () => {
    const lignes = ECARTS
      .split("\n")
      .filter((ligne) => ligne.startsWith("| ") && !ligne.startsWith("| ---") && !ligne.startsWith("| Réf"));
    expect(lignes.length).toBeGreaterThanOrEqual(12);
    for (const ligne of lignes) {
      expect(/Accepté|Soldé/.test(ligne), ligne.slice(0, 80)).toBe(true);
      expect(ligne).toContain("·");
    }
  });

  it("inscrit la recette humaine au registre des décisions", () => {
    expect(A_TRANCHER).toContain("T-15");
    expect(A_TRANCHER).toContain("ecarts-004.md");
  });
});
