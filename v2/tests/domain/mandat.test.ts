import { describe, expect, it } from "vitest";
import {
  chargesMensuellesValides,
  datesMandatValides,
  modeMandatValide,
  notesMandatValides,
  statutMandatValide,
} from "@/domain/mandat";

describe("mandat", () => {
  it("valide le mode et le statut", () => {
    expect(modeMandatValide("propre")).toBe(true);
    expect(modeMandatValide("mandat_tiers")).toBe(true);
    expect(modeMandatValide("autre")).toBe(false);
    expect(statutMandatValide("actif")).toBe(true);
    expect(statutMandatValide("suspendu")).toBe(true);
    expect(statutMandatValide("archive")).toBe(false);
  });

  it("borne les charges mensuelles", () => {
    expect(chargesMensuellesValides(0)).toBe(true);
    expect(chargesMensuellesValides(25_000)).toBe(true);
    expect(chargesMensuellesValides(1_000_000)).toBe(true);
    expect(chargesMensuellesValides(-1)).toBe(false);
    expect(chargesMensuellesValides(1_000_001)).toBe(false);
    expect(chargesMensuellesValides(12.5)).toBe(false);
  });

  it("valide les dates et les notes", () => {
    expect(datesMandatValides(null, null)).toBe(true);
    expect(datesMandatValides("2026-01-01", "2026-12-31")).toBe(true);
    expect(datesMandatValides("2026-12-31", "2026-01-01")).toBe(false);
    expect(datesMandatValides("2026-13-01", null)).toBe(false);
    expect(notesMandatValides("note")).toBe(true);
    expect(notesMandatValides("x".repeat(1_001))).toBe(false);
  });
});
