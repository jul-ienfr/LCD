import { describe, expect, it } from "vitest";
import { datesPlage } from "@/domain/restriction-sejour";

describe("datesPlage", () => {
  it("génère une plage inclusive", () => {
    expect(datesPlage("2027-01-01", "2027-01-03")).toEqual([
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
    ]);
  });

  it("filtre les jours de semaine", () => {
    expect(
      datesPlage("2027-01-01", "2027-01-04", [6, 7]),
    ).toEqual(["2027-01-02", "2027-01-03"]);
  });

  it("refuse une fin antérieure au début", () => {
    expect(() => datesPlage("2027-01-03", "2027-01-01")).toThrow(
      "ne peut pas précéder",
    );
  });

  it("refuse une plage de plus de 366 jours", () => {
    expect(() => datesPlage("2027-01-01", "2028-01-02")).toThrow(
      "366 jours",
    );
  });

  it("refuse un jour de semaine invalide", () => {
    expect(() =>
      datesPlage("2027-01-01", "2027-01-02", [8]),
    ).toThrow("jours de semaine");
  });
});
