/**
 * T100 — Garde-fous de thème : contraste, cible 44 px, décision de publication.
 * T101 — Contrôle des six thèmes en clair et sombre, rapport
 *        `.artifacts/ergonomie/contrastes.json`.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { THEMES } from "@/domain/apparence/registre";
import type { Palette, Theme } from "@/domain/apparence/types";
import {
  cibleSuffisante,
  contraste,
  echecsContraste,
  enPixels,
  hauteurCiblePx,
  ratioContraste,
  SEUIL_CIBLE_PX,
  SEUIL_CONTRASTE_TEXTE,
  validerThemePourPublication,
  verifierTousLesThemes,
} from "@/lib/theme/validation";

const ARTEFACT = path.join(".artifacts", "ergonomie", "contrastes.json");

function theme(partiel: Partial<Theme> & { clair: Palette; sombre: Palette }): Theme {
  return {
    id: "test",
    nom: "Test",
    description: "Thème de test",
    typographie: {
      policeTexte: "sans-serif",
      policeTitre: "sans-serif",
      policeMono: "monospace",
      graisseTitre: 600,
      interlettrageTitre: "0em",
    },
    formes: {
      rayonControle: "0.5rem",
      rayonCarte: "1rem",
      rayonGrand: "1.5rem",
      rayonBouton: "0.5rem",
      bordureLargeur: "1px",
    },
    ombres: { carte: "none", elevee: "none" },
    densite: {
      espaceSection: "2rem",
      espaceCarte: "1rem",
      hauteurControle: "2.75rem",
    },
    variantes: { nav: "pilule", entete: "gauche" },
    ...partiel,
  };
}

describe("calcul de contraste", () => {
  it("rend 21:1 entre noir et blanc", () => {
    expect(contraste("#000000", "#ffffff")).toBe(21);
  });

  it("rend 1:1 pour une couleur avec elle-même", () => {
    expect(contraste("#0e7c6b", "#0e7c6b")).toBe(1);
  });

  it("est symétrique et arrondi au centième", () => {
    expect(contraste("#0e7c6b", "#ffffff")).toBe(contraste("#ffffff", "#0e7c6b"));
    expect(contraste("#0e7c6b", "#ffffff")).toBe(5.1);
  });

  it("refuse une couleur illisible", () => {
    expect(contraste("teal", "#ffffff")).toBe(0);
    expect(contraste("#fff", "#000000")).toBe(0);
  });

  it("applique le seuil de 4,5:1", () => {
    expect(SEUIL_CONTRASTE_TEXTE).toBe(4.5);
    expect(contraste("#0e7c6b", "#ddf2ec")).toBeLessThan(SEUIL_CONTRASTE_TEXTE);
    expect(contraste("#131722", "#ffffff")).toBeGreaterThanOrEqual(
      SEUIL_CONTRASTE_TEXTE,
    );
  });
});

describe("cible tactile 44 px", () => {
  it("convertit les unités CSS", () => {
    expect(enPixels("2.75rem")).toBe(44);
    expect(enPixels("44px")).toBe(44);
    expect(enPixels("2.5rem")).toBe(40);
    expect(enPixels("1.5rem")).toBe(24);
    expect(enPixels("auto")).toBeNull();
    expect(enPixels(null)).toBeNull();
  });

  it("déclare le seuil à 44 px", () => {
    expect(SEUIL_CIBLE_PX).toBe(44);
  });

  it("accepte 44 px et refuse 40 px", () => {
    const base = THEMES[0]!;
    expect(cibleSuffisante(base)).toBe(true);
    const petit = theme({
      clair: base.clair,
      sombre: base.sombre,
      densite: { ...base.densite, hauteurControle: "2.5rem" },
    });
    expect(cibleSuffisante(petit)).toBe(false);
    expect(hauteurCiblePx(petit)).toBe(40);
  });

  it("ne bloque pas un thème qui ne déclare pas de hauteur", () => {
    const base = THEMES[0]!;
    const sansHauteur = theme({
      clair: base.clair,
      sombre: base.sombre,
      densite: { ...base.densite, hauteurControle: "" },
    });
    expect(cibleSuffisante(sansHauteur)).toBe(true);
  });
});

describe("validation avant publication", () => {
  it("accepte un thème conforme", () => {
    const rapport = validerThemePourPublication(THEMES[0]!);
    expect(rapport.ok).toBe(true);
    expect(rapport.problemes).toHaveLength(0);
    expect(rapport.message).toBeNull();
  });

  it("bloque un contraste insuffisant avec un message actionnable", () => {
    const base = THEMES[0]!;
    const faible = theme({
      id: "faible",
      nom: "Faible",
      clair: { ...base.clair, encre: "#8a94a8" },
      sombre: base.sombre,
    });
    const rapport = validerThemePourPublication(faible);
    expect(rapport.ok).toBe(false);
    expect(rapport.problemes[0]?.type).toBe("contraste");
    expect(rapport.problemes[0]?.message).toContain("4.5:1");
    expect(rapport.problemes[0]?.details.join(" ")).toContain("minimum 4.5:1");
    expect(echecsContraste(faible).length).toBeGreaterThan(0);
  });

  it("bloque une hauteur de contrôle sous 44 px avec la correction attendue", () => {
    const base = THEMES[0]!;
    const petit = theme({
      id: "petit",
      nom: "Petit",
      clair: base.clair,
      sombre: base.sombre,
      densite: { ...base.densite, hauteurControle: "2.5rem" },
    });
    const rapport = validerThemePourPublication(petit);
    expect(rapport.ok).toBe(false);
    const probleme = rapport.problemes.find((p) => p.type === "cible");
    expect(probleme?.message).toContain("40 px");
    expect(probleme?.details.join(" ")).toContain("2.75rem");
  });

  it("cumule les deux blocages", () => {
    const base = THEMES[0]!;
    const mauvais = theme({
      id: "mauvais",
      nom: "Mauvais",
      clair: { ...base.clair, encre: "#b8bec9" },
      sombre: base.sombre,
      densite: { ...base.densite, hauteurControle: "2rem" },
    });
    const rapport = validerThemePourPublication(mauvais);
    expect(rapport.problemes.map((p) => p.type).sort()).toEqual([
      "cible",
      "contraste",
    ]);
  });
});

describe("six thèmes du registre", () => {
  it("en contrôle exactement six", () => {
    expect(THEMES).toHaveLength(6);
    expect(THEMES.map((t) => t.id).sort()).toEqual([
      "ardoise",
      "foret",
      "nuit",
      "ocean",
      "sable",
      "sejour",
    ]);
  });

  it("calcule les contrastes en clair et en sombre pour chacun", () => {
    for (const t of THEMES) {
      const modes = ratioContraste(t);
      expect(modes.map((m) => m.mode)).toEqual(["clair", "sombre"]);
      for (const mode of modes) {
        expect(mode.mesures.length).toBeGreaterThan(0);
      }
    }
  });

  it("n'a aucun contraste sous 4,5:1 (gate G5)", () => {
    const rapport = verifierTousLesThemes();
    const resume = rapport.echecs
      .map((e) => `${e.themeId}/${e.mode} ${e.libelle} ${e.ratio}:1`)
      .join("\n");
    expect(resume).toBe("");
    expect(rapport.resume.ok).toBe(true);
  });

  it("respecte la cible tactile 44 px sur chaque thème", () => {
    for (const t of THEMES) {
      expect(hauteurCiblePx(t)).not.toBeNull();
      expect(cibleSuffisante(t)).toBe(true);
    }
  });

  it("écrit le rapport de contrastes dans .artifacts/ergonomie/contrastes.json", async () => {
    const rapport = verifierTousLesThemes();
    await mkdir(path.dirname(ARTEFACT), { recursive: true });
    await writeFile(
      ARTEFACT,
      `${JSON.stringify(
        {
          tache: "T101",
          seuilContraste: SEUIL_CONTRASTE_TEXTE,
          seuilCiblePx: SEUIL_CIBLE_PX,
          genereLe: new Date().toISOString(),
          resume: rapport.resume,
          themes: rapport.themes.map((t) => ({
            themeId: t.themeId,
            themeNom: t.themeNom,
            hauteurPx: t.hauteurPx,
            modes: t.modes.map((mode) => ({
              mode: mode.mode,
              mesures: mode.mesures,
              echecs: mode.echecs,
            })),
          })),
          echecs: rapport.echecs,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    expect(rapport.resume.themes).toBe(6);
    expect(rapport.resume.paires).toBeGreaterThan(0);
  });
});
