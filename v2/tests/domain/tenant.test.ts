import { describe, expect, it } from "vitest";
import { slugValide } from "@/domain/tenant";

describe("slug de tenant (FR-018)", () => {
  it("accepte les minuscules, chiffres et tirets", () => {
    expect(slugValide("a")).toBe(true);
    expect(slugValide("lcd")).toBe(true);
    expect(slugValide("log2")).toBe(true);
    expect(slugValide("parc-nord")).toBe(true);
    expect(slugValide("a".repeat(40))).toBe(true);
  });

  it("refuse les formes hors contrat", () => {
    expect(slugValide("")).toBe(false);
    expect(slugValide("Parc")).toBe(false);
    expect(slugValide("parc nord")).toBe(false);
    expect(slugValide("parc_nord")).toBe(false);
    expect(slugValide("parc.")).toBe(false);
    expect(slugValide("parc-")).toBe(false);
    expect(slugValide("-parc")).toBe(false);
    expect(slugValide("é")).toBe(false);
    expect(slugValide("a".repeat(41))).toBe(false);
  });
});
