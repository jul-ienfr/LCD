import { describe, expect, it } from "vitest";
import { jourParis } from "@/lib/date-paris";

describe("jourParis", () => {
  it("bascule au lendemain à minuit heure d’hiver", () => {
    expect(jourParis(new Date("2026-01-01T23:30:00Z"))).toBe("2026-01-02");
  });

  it("bascule au lendemain à minuit heure d’été", () => {
    expect(jourParis(new Date("2026-07-01T22:30:00Z"))).toBe("2026-07-02");
  });
});
