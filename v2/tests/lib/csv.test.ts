import { describe, expect, it } from "vitest";
import { celluleCsv } from "@/lib/csv";

describe("export CSV", () => {
  it("entoure et échappe les guillemets", () => {
    expect(celluleCsv("Santa Severa")).toBe('"Santa Severa"');
    expect(celluleCsv('Le "Parc"')).toBe('"Le ""Parc"""');
    expect(celluleCsv(null)).toBe('""');
    expect(celluleCsv(undefined)).toBe('""');
    expect(celluleCsv(12)).toBe('"12"');
  });

  it("neutralise les formules Excel", () => {
    expect(celluleCsv("=HYPERLINK(\"http://x\")")).toBe(
      '"\'=HYPERLINK(""http://x"")"',
    );
    expect(celluleCsv("+SUM(A1:A2)")).toBe('"\'+SUM(A1:A2)"');
    expect(celluleCsv("-2+3")).toBe('"\'-2+3"');
    expect(celluleCsv("@SUM(A1)")).toBe('"\'@SUM(A1)"');
    expect(celluleCsv("\t=cmd")).toBe('"\'\t=cmd"');
    expect(celluleCsv("\r=cmd")).toBe('"\'\r=cmd"');
    expect(celluleCsv("   =cmd")).toBe('"\'   =cmd"');
  });

  it("laisse les valeurs normales intactes", () => {
    expect(celluleCsv("2026-10-25")).toBe('"2026-10-25"');
    expect(celluleCsv("Client - option")).toBe('"Client - option"');
    expect(celluleCsv("")).toBe('""');
  });
});
