import { describe, expect, it } from "vitest";
import {
  accentContrasteSuffisant,
  contraste,
  melangerCouleur,
  styleIdentite,
  urlLogoValide,
} from "@/domain/identite-site";

describe("identité de marque", () => {
  it("valide les URL de logo relatives ou http(s) uniquement", () => {
    expect(urlLogoValide("/logo.svg")).toBe(true);
    expect(urlLogoValide("https://cdn.example.com/logo.png")).toBe(true);
    expect(urlLogoValide("javascript:alert(1)")).toBe(false);
    expect(urlLogoValide("//evil.example/logo.png")).toBe(false);
    expect(urlLogoValide("logo.png")).toBe(false);
  });

  it("exige un contraste lisible en clair et en sombre", () => {
    expect(accentContrasteSuffisant("#0e7c6b")).toBe(true);
    expect(accentContrasteSuffisant("#fef08a")).toBe(false);
    expect(contraste("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("génère un accent dérivé pour les deux modes", () => {
    const css = styleIdentite("#0e7c6b");
    expect(css).toContain(":root:root{--accent:#0e7c6b");
    expect(css).toContain("prefers-color-scheme: dark");
    expect(css).toContain(".theme-sombre");
    expect(styleIdentite(null)).toBe("");
    expect(melangerCouleur("#000000", "#ffffff", 0.5)).toBe("#808080");
  });
});
