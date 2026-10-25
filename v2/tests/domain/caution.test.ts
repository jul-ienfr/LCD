import { describe, expect, it } from "vitest";
import {
  TRANSITIONS_CAUTION,
  montantCautionValide,
  montantRetenuValide,
} from "@/domain/caution";

describe("caution", () => {
  it("valide les montants", () => {
    expect(montantCautionValide(50_000)).toBe(true);
    expect(montantCautionValide(0)).toBe(false);
    expect(montantCautionValide(-1)).toBe(false);
    expect(montantCautionValide(10_000_001)).toBe(false);
    expect(montantRetenuValide(10_000, 50_000)).toBe(true);
    expect(montantRetenuValide(50_000, 50_000)).toBe(true);
    expect(montantRetenuValide(50_001, 50_000)).toBe(false);
    expect(montantRetenuValide(0, 50_000)).toBe(false);
  });

  it("contrôle les transitions", () => {
    expect(TRANSITIONS_CAUTION.attendue).toEqual(["recue"]);
    expect(TRANSITIONS_CAUTION.recue).toEqual(["restituee", "retenue"]);
    expect(TRANSITIONS_CAUTION.restituee).toEqual([]);
    expect(TRANSITIONS_CAUTION.retenue).toEqual([]);
  });
});
