import { describe, expect, it } from "vitest";
import {
  DESIGNS,
  DESIGN_DEFAUT,
  designParId,
  estDesignValide,
  jetonsCss,
  styleDesign,
  type Jetons,
} from "./themes";

// Contraste WCAG 2.2 : un design ne peut pas être joli et illisible. Le test
// échoue si une palette passe sous le seuil — c'est l'ancrage qui empêche
// d'ajouter un thème « au feeling ».

function luminance(hex: string): number {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const jetons = (j: Jetons): [string, string][] => Object.entries(j) as [string, string][];

describe("registre des designs", () => {
  it("ids uniques et valides, défaut présent", () => {
    const ids = DESIGNS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(estDesignValide(DESIGN_DEFAUT)).toBe(true);
    expect(designParId(DESIGN_DEFAUT)?.nom).toBeTruthy();
    for (const d of DESIGNS) {
      expect(d.nom.length).toBeGreaterThan(2);
      expect(d.description.length).toBeGreaterThan(10);
    }
  });

  it("chaque jeton est une couleur hexadécimale", () => {
    for (const d of DESIGNS) {
      for (const [, v] of [...jetons(d.clair), ...jetons(d.sombre)]) {
        expect(v).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it("aucun design ne change les couleurs d'état (ok/alerte/danger)", () => {
    for (const d of DESIGNS) {
      const cles = [...Object.keys(d.clair), ...Object.keys(d.sombre)];
      expect(cles).not.toContain("ok");
      expect(cles).not.toContain("alerte");
      expect(cles).not.toContain("danger");
    }
  });
});

describe("contraste WCAG 2.2 AA des palettes", () => {
  for (const d of DESIGNS) {
    for (const mode of ["clair", "sombre"] as const) {
      const j = mode === "clair" ? d.clair : d.sombre;
      it(`${d.id}/${mode} : textes lisibles`, () => {
        expect(contraste(j.encre, j.surface)).toBeGreaterThanOrEqual(7);
        expect(contraste(j.encre, j.fond)).toBeGreaterThanOrEqual(7);
        expect(contraste(j.encreDouce, j.surface)).toBeGreaterThanOrEqual(4.5);
        expect(contraste(j.encreFaine, j.surface)).toBeGreaterThanOrEqual(4.5);
        expect(contraste(j.encreFaine, j.fond)).toBeGreaterThanOrEqual(4.5);
        // L'accent sert de texte (liens, chiffres) : 4,5 minimum.
        expect(contraste(j.accent, j.surface)).toBeGreaterThanOrEqual(4.5);
        expect(contraste(j.accent, j.fond)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

describe("injection CSS", () => {
  it("jetonsCss expose les 10 variables attendues", () => {
    const css = jetonsCss(DESIGNS[0], "clair");
    expect(Object.keys(css)).toHaveLength(10);
    expect(css["--accent"]).toBe(DESIGNS[0].clair.accent);
    expect(css["--surface-2"]).toBe(DESIGNS[0].clair.surface2);
  });

  it("styleDesign couvre clair, OS sombre et choix explicite", () => {
    const css = styleDesign(DESIGNS[1]);
    expect(css).toContain(":root:root{");
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain(":root:root.theme-sombre{");
    expect(css).toContain(`--accent:${DESIGNS[1].clair.accent}`);
    expect(css).toContain(`--accent:${DESIGNS[1].sombre.accent}`);
  });
});
