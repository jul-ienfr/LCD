import { describe, expect, it } from "vitest";
import {
  nuitsSejour,
  sejourValide,
  sejoursSeChevauchent,
} from "@/domain/planning";

describe("planning", () => {
  it("détecte un chevauchement", () => {
    expect(
      sejoursSeChevauchent("2026-07-01", "2026-07-08", "2026-07-05", "2026-07-10"),
    ).toBe(true);
  });

  it("accepte deux séjours adjacents (fin exclusive)", () => {
    expect(
      sejoursSeChevauchent("2026-07-01", "2026-07-08", "2026-07-08", "2026-07-12"),
    ).toBe(false);
  });

  it("refuse un séjour inversé", () => {
    expect(sejourValide("2026-07-08", "2026-07-01")).toBe(false);
  });

  it("compte les nuits", () => {
    expect(nuitsSejour("2026-07-01", "2026-07-08")).toBe(7);
  });
});
